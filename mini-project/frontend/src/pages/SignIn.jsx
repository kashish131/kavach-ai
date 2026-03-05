import React, { useState } from 'react'
import bg from '../assets/authBg.png'
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { userDataContext } from '../context/UserContext';

function SignIn() {
  const [showPassword, setShowPassword] = React.useState(false);
  const {serverUrl,userData, setUserData} = React.useContext(userDataContext);
  const navigate = useNavigate();
  const[email,setEmail]  = React.useState("");
  const[password,setPassword]  = React.useState("");
  const[err,setErr]=React.useState("")
  const [loading,setLoading]=React.useState(false)
  const handleSignIn = async(e)=>{
    e.preventDefault()
    setErr("")
    setLoading(true)
    try {
      let result = await axios.post(`${serverUrl}/api/auth/signin`,{
        email,password

      },{withCredentials:true})
      setUserData(result.data)
      setLoading(false)
      navigate("/")
    } catch (error) {
      console.log(error)
      setUserData(null)
      setLoading(false)
      setErr(error.response.data.message)
    }
  }
  return (
    <div
      className='w-full h-[100vh] bg-cover flex justify-center items-center'
      style={{ backgroundImage: `url(${bg})` }}
    >
      <form className='w-[90%] h-[600px] max-w-[500px] bg-[#00000062] backdrop-blur shadow-lg shadow-black flex flex-col justify-center gap-[20px] px-[20px]' onSubmit={handleSignIn}>

        <h1 className='text-white text-[30px] font-semibold mb-[30px] text-center'>
          Sign In to <span className='text-blue-400'>Virtual Assistant</span>
        </h1>
<input
  type="email"
  placeholder='Email'
  required
  onChange={(e) => setEmail(e.target.value)}
  value={email}
  className='w-full h-[60px] outline-none border-2 border-white bg-transparent text-white placeholder-gray-300 px-[20px] py-[10px] rounded-full text-[18px]'
/>

        <div className='w-full h-[60px] border-2 border-white bg-transparent text-white rounded-full text-[18px] relative flex items-center'>
<input
  type={showPassword ? "text" : "password"}
  placeholder='Password'
  required
  onChange={(e) => setPassword(e.target.value)}
  value={password}
  className='w-full h-full rounded-full outline-none bg-transparent px-[20px] pr-[55px]'
/>

          <div
            className='absolute top-[18px] right-[20px] w-[25px] h-[25px] text-white cursor-pointer z-10'
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </div>
        </div>
        {err.length>0 && <p className='text-red-500 text-[17px]'>
          *{err}
          </p>}
        <button className='w-[150px] h-[45px] mx-auto mt-[10px] text-black font-semibold bg-white rounded-full text-[16px]' disabled={loading}>
          {loading ? "Loading..." : "Sign In"}
        </button>
        <p className='text-white text-[18px] text-center'>
          Want to create a new account ?{' '}
          <span
            className='text-blue-400 cursor-pointer'
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </p>

      </form>
    </div>
  )
}

export default SignIn;