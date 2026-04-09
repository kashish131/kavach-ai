import React from 'react'
import { Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Home from './pages/Home'
import Customize from './pages/Customize'
import Customize2 from './pages/Customize2'
import { userDataContext } from './context/UserContext'
import { Navigate } from 'react-router-dom'

function App() {
  const {userData, setUserData} = React.useContext(userDataContext);
  return (
    <Routes>
       <Route path="/" element={(userData?.assistantImage && userData?.assistantName)? <Home/> : <Navigate to={"/customize"}/>}/>
      <Route path="/signup" element={!userData?<SignUp/>:<Navigate to={"/"}/>}/>
      <Route path="/signin" element={!userData?<SignIn/>:<Navigate to={"/"} />} />
      <Route path="/customize" element={userData?<Customize/>:<Navigate to={"/signup"} />} />
      <Route path="/customize2" element={userData?<Customize2/>:<Navigate to={"/signup"} />} />
    </Routes>
  )
}

export default App
