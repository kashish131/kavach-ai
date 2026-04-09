import React, { use } from 'react'
import { createContext } from "react";
import { useEffect } from 'react';
import axios from 'axios';

export const userDataContext = createContext();
function UserContext({ children }) {
  const serverUrl = "http://localhost:8000";
  const [userData, setUserData] = React.useState(null);
   const [frontendImage,setFrontendImage] = React.useState(null)
  const [backendImage,setBackendImage] = React.useState(null)
  const [selectedImage,setSelectedImage] = React.useState(null)
  const handleCurrentUser = async()=>{
    try{
      const result = await axios.get(`${serverUrl}/api/user/current`,{withCredentials:true})
      setUserData(result.data)
      console.log(result.data);
    }catch(error){
      console.log(error)
    }
  }

const getGeminiResponse = async(command)=>{
  try {

    const result = await axios.post(
      `${serverUrl}/api/user/asktoassistant`,
      { command },              // send the same field name the server expects
      { withCredentials: true }
    );

    return result.data;

  } catch (error) {
    // log more detail from the server if available so we can diagnose bad requests
    if (error.response) {
      console.log("Gemini error response (status", error.response.status, "):", error.response.data);
    } else {
      console.log("Gemini error:", error.message);
    }
    return null;
  }
}


  useEffect(()=>{
    handleCurrentUser()
  },[])

  const value = {
    serverUrl,userData, setUserData, backendImage,setBackendImage,frontendImage,setFrontendImage,selectedImage,setSelectedImage,getGeminiResponse
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;
