import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, Toaster } from "sonner";
import { signupSchema } from "../validations/authValidation";
import { ZodError } from "zod";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { username, email, password, bio, avatar };

    try {
      signupSchema.parse(data); // validate before sending
      setErrors({}); // clear previous errors

      let res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, data, {
        withCredentials: true,
      });

      toast.success("User created Successfully!");
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error(error);
    
      if (error instanceof ZodError) {
        const fieldErrors = {};
        error.issues.forEach((issue) => {
          fieldErrors[issue.path[0]] = issue.message;
        });
        setErrors(fieldErrors);
        return;
      }
      

      if (error.response) {
        toast.error(error.response.data?.message || "Server Error!");
      } else if (error.request) {
        toast.error("Network error. Please check your connection!");
      } else {
        toast.error("An unexpected error occurred!");
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
            <h1 className="text-white text-left mt-10 text-2xl font-[gilroy]">Create Your Accountss</h1>
            <div className="flex flex-col gap-y-2">

              <h1>Enter your username</h1>
              <input
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrors((prev) => ({ ...prev, username: undefined }));
                }}
                type="text"
                placeholder="Username...."
                className="px-3 py-2 bg-white text-black rounded-xl w-96 outline-0"
              />
              {errors.username && <p className="text-red-500 text-sm">{errors.username}</p>}

              <h1>Enter your email</h1>
              <input
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                type="email"
                placeholder="Email...."
                className="px-3 py-2 bg-white text-black rounded-xl w-96 outline-0"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

              <h1>Enter your bio</h1>
              <input
                onChange={(e) => {
                  setBio(e.target.value);
                  setErrors((prev) => ({ ...prev, bio: undefined }));
                }}
                type="text"
                placeholder="Bio...."
                className="px-3 py-2 bg-white text-black rounded-xl w-96 outline-0"
              />
              {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}

              <h1>Enter your password</h1>
              <input
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                type="password"
                placeholder="Password...."
                className="px-3 py-2 bg-white text-black rounded-xl w-96 outline-0"
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

              <h1>Enter your Profile image URL</h1>
              <input
                onChange={(e) => {
                  setAvatar(e.target.value);
                  setErrors((prev) => ({ ...prev, avatar: undefined }));
                }}
                type="url"
                placeholder="Url...."
                className="px-3 py-2 bg-white text-black rounded-xl w-96 outline-0"
              />
              {errors.avatar && <p className="text-red-500 text-sm">{errors.avatar}</p>}

              <input
                type="submit"
                value="Register"
                className="w-full bg-[#FF6C00] px-3 py-2 rounded-xl mt-5 cursor-pointer"
              />
            </div>

            <p className="mt-3 text-sm">
              Already have an account?{" "}
              <Link to="/" className="text-[#FF6C00] underline">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Signup;
