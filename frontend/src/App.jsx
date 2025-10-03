
import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import VideoPage from './pages/VideoPage'
import Navbar from '../src/components/Navbar'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
function App() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/' || location.pathname === '/signup';
  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/home' element={<Home />} />
        <Route path='/videopage/:postId' element={<VideoPage />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/createpost' element={<CreatePost />} />
      </Routes>
    </>
  )
}
export default App
