import axios from 'axios';
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { loginSchema } from '../validations/authValidation';

const Login = () => {
  const navigate = useNavigate();
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const handleSubmit = async (e) =>{
    e.preventDefault();
    const data = {email,password};
    try {
      loginSchema.parse(data);
        let res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`,data,{
          withCredentials:true
        })
        toast.success("Login Successful!");
        setTimeout(()=>{
           navigate('/home')
        },1500)
        setEmail('')
        setPassword('')
    } catch (error) {
      if(error.name==='ZodError'){
        toast.error(error.errors[0].message);
      }
       console.error(error);
    }
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
      <h1 className='text-white  text-left mt-10 text-2xl font-[gilroy]  relative z-[9999]'>Login To Your Account</h1>
        <div className='flex flex-col gap-y-2'>
        <h1>Enter your email</h1>
        <input onChange={(e)=>setEmail(e.target.value)} type="email" placeholder='Email....' className='px-3 py-2 bg-white rounded-xl text-black placeholder:text-black w-96 outline-0' />
        <h1>Enter your password</h1>
        <input onChange={(e)=>setPassword(e.target.value)} type="password" placeholder='Password....' className='px-3 py-2 bg-white rounded-xl text-black placeholder:text-black w-96 outline-0' />
        <input type="submit" value="Login" className='w-full bg-[#FF6C00] px-3 py-2 rounded-xl mt-5'/>
        </div>
        <p className="mt-3 text-sm">
    Don’t have an account?{" "}
    <Link to="/signup" className="text-[#FF6C00] underline">Sign up</Link>
  </p>
      </form>
      </div>
    </div>
    </>
  )
}

export default Login