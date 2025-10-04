import axios from 'axios';
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { signupSchema } from '../validations/authValidation';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [bio,setBio] = useState('');
  const [avatar,setAvatar] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) =>{
    e.preventDefault();
    const data = {username,email,password,bio,avatar};
    try {
      signupSchema.parse(data);
      let res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`,data,{withCredentials:true})
      toast.success("User created Successfully!")
      setTimeout(()=>{
          navigate('/');
      },1500)
    } catch (error) {
      if(error.name==='ZodError'){
        toast.error(error.errors[0].message);
      }
      else{
        toast.error("Server Error!");
      }
      console.error(error);
    }
    setAvatar('');
    setBio('');
    setEmail('');
    setPassword('');
    setUsername('');
  }

  return (
    <>
    <Toaster position='top-right' richColors/>
    <div className='w-full h-screen bg-[#000]'>
      <div className='flex z-10 relative justify-center'>
      <div className="blob  w-40 h-40 absolute rounded-full blur-3xl  bg-[#FF6C00]"></div>
      </div>
      <div className='w-full h-screen flex items-center justify-center  absolute top-0 px-16'>
      <form onSubmit={handleSubmit} className='relative  text-white z-50 mt-5'>
      <h1 className='text-white  text-left mt-10 text-2xl font-[gilroy]  relative z-[9999]'>Create Your Account</h1>
        <div className='flex flex-col gap-y-2'>
        <h1>Enter your username</h1>
        <input onChange={(e)=>setUsername(e.target.value)} type="text" placeholder='Username....' className='px-3 py-2 bg-white text-black rounded-xl placeholder:text-black w-96 outline-0' />
        <h1>Enter your email</h1>
        <input type="email" onChange={(e)=>setEmail(e.target.value)} placeholder='Email....' className='px-3 text-black py-2 bg-white rounded-xl placeholder:text-black w-96 outline-0' />
        <h1>Enter your bio</h1>
        <input type="text" placeholder='Bio....' onChange={(e)=>setBio(e.target.value)} className='px-3 py-2 bg-white rounded-xl placeholder:text-black w-96 text-black outline-0' />
        <h1>Enter your password</h1>
        <input type="password" onChange={(e)=>setPassword(e.target.value)} placeholder='Password....' className='px-3 py-2 bg-white rounded-xl text-black placeholder:text-black w-96 outline-0' />
        <h1>Enter your Profile image url</h1>
        <input onChange={(e)=>setAvatar(e.target.value)} type="url" placeholder='Url....' className='px-3 py-2 bg-white rounded-xl placeholder:text-black text-black w-96 outline-0' />
        <input type="submit" value="Register" className='w-full bg-[#FF6C00] px-3 py-2 rounded-xl mt-5'/>
        </div>
        <p className="mt-3 text-sm">
    Already have an account?{" "}
    <Link to="/" className="text-[#FF6C00] underline">Login</Link>
  </p>

      </form>
      </div>
    </div>
    </>
  )
}

export default Signup;