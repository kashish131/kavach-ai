import React from 'react'
import { userDataContext } from '../context/UserContext';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useContext, useEffect, useState, useRef } from 'react';
import aiImg from "../assets/ai.gif"
import { CgMenuRightAlt } from "react-icons/cg";
import { RxCross2 } from "react-icons/rx";
import userImg from "../assets/user.gif"


function Home() {

const {userData, serverUrl,setUserData,getGeminiResponse} = React.useContext(userDataContext);
const navigate = useNavigate();

const [listening, setListening] = React.useState(false);
const [userText, setUserText] = React.useState("");
const [aiText, setAiText] = React.useState("");
const [voices, setVoices] = useState([]);
const [audioEnabled, setAudioEnabled] = useState(false);
const isSpeakingRef = React.useRef(false);
const recognitionRef = React.useRef(null);
const [ham, setHam] = React.useState(false);
const isRecognizingRef = React.useRef(false);
const synth= window.speechSynthesis;

const handleLogOut = async () => {
  try {
    const result = await axios.get(`${serverUrl}/api/auth/logout`, 
      {withCredentials: true})
      setUserData(null);
      navigate("/signin");
  } catch (error) {
    setUserData(null);
    console.log(error)
  }
}

const startRecognition=()=>{
  if(!isSpeakingRef.current && !isRecognizingRef.current){
  try{
    recognitionRef.current?.start();
    console.log("Recognition requested to start")
  }catch(error){
    if(error.name !== "InvalidStateError"){
      console.log("start error:", error);
    }
  }
}
};

const enableAudio = () => {
  // calling a dummy utterance in response to a user gesture unlocks speech
  setAudioEnabled(true);
  if (synth) {
    const u = new SpeechSynthesisUtterance('');
    synth.speak(u);
  }
};

const speak=(text)=>{
  if (!synth) {
    console.warn("Speech synthesis not supported in this browser");
    return;
  }

  // auto-enable audio when speaking in response to user input
  if (!audioEnabled) {
    enableAudio();
  }

  // refresh voices if we somehow don't have them yet
  if (voices.length === 0) {
    setVoices(synth.getVoices());
  }

  console.log("speak() called with text:", text);
  console.log("available voices:", voices);

  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang="hi-IN";

  // choose any hindi voice or fallback to first voice
  const hindiVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('hi'));
  if (hindiVoice) {
    utterance.voice = hindiVoice;
  } else if (voices.length > 0) {
    console.warn("Hindi voice not found, using default voice");
    utterance.voice = voices[0];
  }

  utterance.onerror = (e) => {
    console.error("utterance error", e);
  };

  isSpeakingRef.current=true;

  utterance.onend=()=>{
    setAiText("");
    isSpeakingRef.current=false;
    startRecognition();
  }

  synth.speak(utterance);
}

const handlecommand=(data)=>{

  if(!data){
    console.log("No response from assistant");
    return;
  }

  const {type,userInput,response}=data;

  speak(response);

  if (type === "google_search") {
    const query = encodeURIComponent(userInput);
    window.open(`https://www.google.com/search?q=${query}`, "_blank");
  }

  if (type === "youtube_search") {
    const query = encodeURIComponent(userInput);
    window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
  }

  if (type === "youtube_play") {
    const query = encodeURIComponent(userInput);
    window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
  }

  if (type === "instagram_open") {
    window.open(`https://www.instagram.com`, "_blank");
  }

  if (type === "facebook_open") {
    window.open(`https://www.facebook.com`, "_blank");
  }

  if (type === "calculator_open") {
    window.open(`https://www.google.com/search?q=calculator`, "_blank");
  }

  if (type === "weather_show") {
    const query = encodeURIComponent("weather " + userInput);
    window.open(`https://www.google.com/search?q=${query}`, "_blank");
  }

}

useEffect(()=>{

  const SpeechRecognition=window.SpeechRecognition || window.webkitSpeechRecognition;

  const recognition=new SpeechRecognition();

  recognition.continuous=true;
  recognition.lang="en-US";
recognition.interimResults=false;
  recognitionRef.current=recognition;

   

  const safeRecognition=()=>{
    if(!recognitionRef.current) return;
    if(!isSpeakingRef.current && !isRecognizingRef.current){

      try{
        recognitionRef.current.start();
        console.log("Recognition requested to start");
      }catch(err){

        if(err.name!=="InvalidStateError"){
          console.error(" start error:", err);
        }

      }

    }

  }

  recognition.onstart=()=>{
    
    isRecognizingRef.current=true;
    setListening(true);
  };

  recognition.onend=()=>{
   
    isRecognizingRef.current=false;
    setListening(false);

    if(isSpeakingRef.current){

      setTimeout(()=>{
        safeRecognition();
      },1000);

    }

  };

  recognition.onerror=(event)=>{

    console.warn("Recognition error", event.error);

    isRecognizingRef.current=false;
    setListening(false);

    if(event.error !== "aborted" && isSpeakingRef.current){

      setTimeout(()=>{
        safeRecognition();
      },1000);

    }

  };

  recognition.onresult=async(e)=>{

    const transcript=e.results[e.results.length-1][0].transcript.trim();

    

    if(transcript.toLowerCase().includes(userData.assistantName.toLowerCase())){
      setAiText("");
      setUserText(transcript);
      recognition.stop();
      isRecognizingRef.current=false;
      setListening(false);

      const data = await getGeminiResponse(transcript);

      if (data) {
        handlecommand(data);
        setAiText(data.response || "");
      } else {
        // something went wrong with the request
        setAiText("Sorry, I couldn't get a response.");
      }
      setUserText("");
    }

  }

  const fallback=setInterval(()=>{

    if(!isSpeakingRef.current && !isRecognizingRef.current){
      safeRecognition();
    }

  },1000)

  safeRecognition();

  return ()=>{
    recognition.stop();
    setListening(false);
    isRecognizingRef.current=false;
    clearInterval(fallback);
  }

},[])

useEffect(() => {
  const updateVoices = () => {
    setVoices(window.speechSynthesis.getVoices());
  };
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
  return () => {
    window.speechSynthesis.onvoiceschanged = null;
  };
}, [])

// keep polling until voices appear, in case the event didn't fire
useEffect(() => {
  if (voices.length === 0 && synth) {
    const timer = setInterval(() => {
      const v = synth.getVoices();
      if (v.length > 0) {
        setVoices(v);
        clearInterval(timer);
      }
    }, 500);
    return () => clearInterval(timer);
  }
}, [voices, synth]);

// automatically enable audio when the user interacts with the page
useEffect(() => {
  const onUserGesture = () => {
    if (!audioEnabled) {
      enableAudio();
    }
  };
  document.addEventListener("mousedown", onUserGesture, { once: true });
  document.addEventListener("touchstart", onUserGesture, { once: true });
  return () => {
    document.removeEventListener("mousedown", onUserGesture);
    document.removeEventListener("touchstart", onUserGesture);
  };
}, [audioEnabled]);

return (
<div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'>

<CgMenuRightAlt className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(true)}/>
<div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform `}>
<RxCross2 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(false)}/>

<button className='w-[150px] h-[45px] mx-auto  text-black font-semibold  bg-white rounded-full cursor-pointer text-[16px]' onClick={handleLogOut}>
Log Out
</button>

<button className='w-[220px] h-[45px] mx-auto  text-black font-semibold bg-white rounded-full cursor-pointer text-[16px]' onClick={() => navigate("/customize")}>
Customize your Assistant
</button>

<div className='w-full h-[2px] bg-gray-400'></div>
<h1 className='text-white font-semibold text-[19px]'>History</h1>
<div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col '>
  {userData.history?.map((his)=>(
    <span className='text-gray-200 text-[18px] truncate '>{his}</span>
  ))}
</div>


</div>
<button className='w-[150px] h-[45px] mx-auto mt-[10px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-white rounded-full cursor-pointer text-[16px]' onClick={handleLogOut}>
Log Out
</button>

<button className='w-[220px] h-[45px] mx-auto mt-[10px] text-black font-semibold bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[16px] hidden lg:block' onClick={() => navigate("/customize")}>
Customize your Assistant
</button>

<div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>

<img src={userData?.assistantImage} alt="Assistant" className='h-full object-cover' />

</div>

<h1 className='text-white text-[24px] mt-[20px] font-semibold'>
I'm {userData?.assistantName}
</h1>
{!aiText && <img src={userImg} alt="" className='w-[200px]'/>}
{aiText && <img src={aiImg} alt="" className='w-[200px]'/>}
<h1 className="text-white text-[20px] font-semibold text-wrap">{userText?userText:aiText?aiText:null}</h1>
</div>
)

}

export default Home