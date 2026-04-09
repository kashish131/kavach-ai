import { response } from "express";
import User from "../models/user.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import moment from  "moment"; 
export const getCurrentUser = async (req,res)=>{
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password");
        if(!user){
            return res.status(400).json({message:"user not found"})
        }
        return res.status(200).json(user)    
    }catch(error){
        return res.status(400).json({message:"get current user error"}) 
    }
}
export const updateAssistant = async(req,res)=>{
    try{
        const{assistantName, imageUrl} = req.body;
        let assistantImage;
        if(req.file){
            assistantImage=await uploadOnCloudinary(req.file.path)
        }else{
            assistantImage=imageUrl
        }
        const user = await User.findByIdAndUpdate(req.userId, { assistantName, assistantImage }, { new: true }).select("-password");
        return res.status(200).json(user)
    }catch(error){
        return res.status(400).json({message:"update assistant error"})
    }
}


export const askToAssistant = async(req,res)=>{
    try{
        // support both `command` and legacy `userInput` from client
        const {command, userInput} = req.body;
        const query = command || userInput;

        // validate input early so we can return a helpful message
        if (!query || typeof query !== 'string' || query.trim() === '') {
            console.log("askToAssistant received empty query", { command, userInput });
            return res.status(400).json({ response: "empty command" });
        }

        const user = await User.findById(req.userId);
        user.history.push(query);
        await user.save();
        const userName = user.name;
        const assistantName = user.assistantName;

        console.log("askToAssistant query:", query);
        const result = await geminiResponse(query, assistantName, userName);
        console.log("assistant raw result:", result);

        if(!result){
            console.warn("Gemini returned no text for query, sending fallback response.");
            // respond with a generic message instead of a 400 error so frontend doesn't crash
            return res.json({
              type: "general",
              userInput: query,
              response: "I'm having trouble contacting the assistant right now. Please try again later."
            });
        }

const jsonMatch = result?.match(/{[\s\S]*}/)

if(!jsonMatch){
    return res.json({
        type:"general",
        userInput:command,
        response:"Hello! How can I help you?"
    })
}
let gemResult;

try{
    gemResult = JSON.parse(jsonMatch[0]);
}catch(err){
    console.log("JSON parse error:", err);
    return res.status(400).json({response:"AI returned invalid format"});
}
        const type=gemResult.type

        switch(type){
            case "get_date":
                return res.json({
                    type,
                    userInput:gemResult.userInput,
                    response:`current date is ${moment().format("YYYY-MM-DD")}`
                });

                case "get_time":
                    return res.json({
                        type,
                        userInput:gemResult.userInput,
                        response:`current time is ${moment().format("HH:mm:A")}`
                    });

                    case "get_day":
                        return res.json({
                            type,
                            userInput:gemResult.userInput,
                            response:`today is ${moment().format("dddd")}`
                        });

                        case "get_month":
                            return res.json({
                                type,
                                userInput:gemResult.userInput,
                                response:`current month is ${moment().format("MMMM")}`
                            });
                            case "google_search":
                            case "youtube_search":
                            case "youtube_play":
                            case "general":
                            case "calculator_open":
                            case "instagram_open":
                            case "facebook_open":
                            case "weather_show":
                                return res.json({
                                    type,
                                    userInput:gemResult.userInput,
                                    response:gemResult.response
                                });
                            default:
                                return res.status(400).json({response:"sorry, i couldn't understand that command"})
        }
    }catch(error){
    console.log("Assistant Error:", error);
    return res.status(500).json({response:"ask to assistant error"})
}
}
