import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

// helper to pull API key either from a direct env var or from the URL stored
function extractKeyFromUrl(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get("key") || undefined;
  } catch (e) {
    return undefined;
  }
}

// keep track of when we are allowed to hit the API again after a quota error
let nextApiCallAllowed = 0;

// fallback response generator for when API quota is exceeded
const getFallbackResponse = (command, userName) => {
  const lower = (command || "").toLowerCase();
  
  // simple keyword matching for common questions
  if (lower.includes("hello") || lower.includes("hi")) {
    return JSON.stringify({
      type: "general",
      userInput: command,
      response: `Hello! Today I am running low on API quota. Try again later.`
    });
  }
  if (lower.includes("who are you") || lower.includes("who created you")) {
    return JSON.stringify({
      type: "general",
      userInput: command,
      response: `I am a virtual assistant made by ${userName}. The AI service is temporarily rate-limited.`
    });
  }
  if (lower.includes("what") || lower.includes("how")) {
    return JSON.stringify({
      type: "general",
      userInput: command,
      response: `I can't answer that right now because my API quota is exceeded. Please try again in a few moments.`
    });
  }
  if (lower.includes("weather")) {
    return JSON.stringify({
      type: "weather_show",
      userInput: command,
      response: "Let me show you the weather."
    });
  }
  if (lower.includes("youtube") || lower.includes("play")) {
    return JSON.stringify({
      type: "youtube_play",
      userInput: command,
      response: "Searching YouTube for you."
    });
  }
  if (lower.includes("google") || lower.includes("search")) {
    return JSON.stringify({
      type: "google_search",
      userInput: command,
      response: "Searching Google for that."
    });
  }
  if (lower.includes("calculator")) {
    return JSON.stringify({
      type: "calculator_open",
      userInput: command,
      response: "Opening calculator for you."
    });
  }
  // default fallback
  return JSON.stringify({
    type: "general",
    userInput: command,
    response: "I am currently low on quota. Please come back in a moment."
  });
};

const geminiResponse = async (command, assistantName, userName) => {
  // if we recently hit a 429, skip the network request and use fallback
  const now = Date.now();
  if (now < nextApiCallAllowed) {
    const waitSec = Math.ceil((nextApiCallAllowed - now) / 1000);
    console.log(`Quota cooldown active, using fallback (${waitSec}s remaining)`);
    return getFallbackResponse(command, userName);
  }

  try {
    // build prompt exactly as before
    const prompt = `
You are a virtual AI assistant named ${assistantName} created by ${userName}.
You are not Google. You behave like a smart voice-enabled personal assistant.

Your task is to understand the user's natural language input and respond with a JSON object like this:

{
  "type": "general" | "google_search" | "youtube_search" | "youtube_play" | 
          "get_time" | "get_date" | "get_day" | "get_month" | 
          "calculator_open" | "instagram_open" | "facebook_open" | "weather_show",

  "userInput": "<original user input>" {only remove your name from the userInput if it is present},

  "response": "<a short spoken response that can be read aloud to the user>"
}

Instructions:
"type": determine the intent of the user.
"userInput": the original sentence the user spoke.
"response": a short voice-friendly reply that can be spoken by the assistant.

Type meanings:
"general": if it's a factual or informational question Or agar koi aisa question puchta h jiska answer tumhe pta h usko bhi general ki category me rakho bas short answer Dena.
"google_search": if the user wants to search something on Google.
"youtube_search": if the user wants to search something on YouTube.
"youtube_play": if the user wants to directly play a video or song.
"calculator_open": if the user wants to open the calculator.
"instagram_open": if the user wants to open Instagram.
"facebook_open": if the user wants to open Facebook.
"weather_show": if the user wants to know the weather.
"get_time": if the user asks for the current time.
"get_date": if the user asks for today's date.
"get_day": if the user asks what day it is.
"get_month": if the user asks for the current month.

Important Rules:
If someone asks "Who created you?" or "Who made you?", answer using ${userName}.
Always keep the response short and voice friendly.
IMPORTANT:
You must ONLY return a valid JSON object.
Do not include explanations, markdown, or text before or after the JSON.
Now process the following user input and return the JSON response.
User Input: ${command}
`;

    // prefer explicit key & model config, fall back to parsing old URL
    const apiKey =
      process.env.GEMINI_API_KEY ||
      extractKeyFromUrl(process.env.GEMINI_API_URL || "") ||
      "";
    // choose a model that is available in the v1 API (see listModels.js output)
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    // use the official SDK so we don't have to manage raw URLs ourselves
    const client = new GoogleGenerativeAI(apiKey);
    // most recent stable API version (v1) is required for Gemini models
    const model = client.getGenerativeModel(
      { model: modelName },
      { apiVersion: "v1" }
    );

    // send the prompt as a plain string; the SDK wraps it correctly
    const response = await model.generateContent(prompt);
    // .text() aggregates the pieces into a single string
    return response?.response?.text();
  } catch (error) {
    // log the full error object for debugging
    console.log("Gemini Error:", error);

    // if it's a quota error, record the earliest retry time and use fallback
    if (error.status === 429 && error.errorDetails) {
      // try to pull delay field from details if available
      const retryInfo = (error.errorDetails || []).find(d => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
      let delaySec = 30;
      if (retryInfo && retryInfo.retryDelay) {
        const m = retryInfo.retryDelay.match(/(\d+)s/);
        if (m) delaySec = parseInt(m[1], 10);
      }
      nextApiCallAllowed = Date.now() + delaySec * 1000;
      console.log(`Quota exceeded for ${delaySec}s, switching to fallback responses`);
      return getFallbackResponse(command, assistantName);
    }

    // if the API call fails, return a minimal JSON string so upstream parsing still works
    return JSON.stringify({
      type: "general",
      userInput: command || "",
      response: "(error)"
    });
  }
};

export default geminiResponse;