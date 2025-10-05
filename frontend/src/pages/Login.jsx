import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { loginSchema } from '../validations/authValidation';
import { ZodError } from 'zod';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({}); // 👈 store field-specific errors

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { email, password };

    try {
      // ✅ validate before sending
      loginSchema.parse(data);
      setErrors({}); // clear previous errors

      let res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, data, {
        withCredentials: true,
      });

      toast.success('Login Successful!');
      setTimeout(() => {
        navigate('/home');
      }, 1500);

      setEmail('');
      setPassword('');
    } catch (error) {
      console.error(error);

      // ✅ Zod validation errors
      if (error instanceof ZodError) {
        const fieldErrors = {};
        error.issues.forEach((issue) => {
          fieldErrors[issue.path[0]] = issue.message;
        });
        setErrors(fieldErrors);
        return;
      }

      // ✅ API errors
      if (error.response) {
        toast.error(error.response.data?.message || 'Server Error!');
      } else if (error.request) {
        toast.error('Network error. Please check your connection!');
      } else {
        toast.error('An unexpected error occurred!');
      }
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="w-full h-screen bg-[#000]">
        <div className="flex z-10 relative justify-center">
          <div className="blob w-40 h-40 absolute rounded-full blur-3xl bg-[#FF6C00]"></div>
        </div>

        <div className="w-full h-screen flex items-center justify-center absolute top-0 px-16">
          <form onSubmit={handleSubmit} className="relative text-white z-50 mt-5">
            <h1 className="text-white text-left mt-10 text-2xl font-[gilroy]">Login To Your Account</h1>

            <div className="flex flex-col gap-y-2">
              {/* Email */}
              <h1>Enter your email</h1>
              <input
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                type="email"
                placeholder="Email...."
                className="px-3 py-2 bg-white rounded-xl text-black placeholder:text-black w-96 outline-0"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

              {/* Password */}
              <h1>Enter your password</h1>
              <input
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                type="password"
                placeholder="Password...."
                className="px-3 py-2 bg-white rounded-xl text-black placeholder:text-black w-96 outline-0"
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

              <input
                type="submit"
                value="Login"
                className="w-full bg-[#FF6C00] px-3 py-2 rounded-xl mt-5 cursor-pointer"
              />
            </div>

            <p className="mt-3 text-sm">
              Don’t haves an account?{' '}
              <Link to="/signup" className="text-[#FF6C00] underline">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
