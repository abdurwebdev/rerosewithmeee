import {z} from 'zod';


export const signupSchema = z.object({
  username:z.string().min(3,"Username must be atleast 3 chracters long"),
  email:z.string().email("Invalid email format"),
  password:z.string().min(6,"Password must be atleast 6 characters long"),
  bio:z.string().max(150,"Bio canot exceed 150 characters").optional(),
  avatar:z.string().url("Must be a valid URL").optional()
})

export const loginSchema = z.object({
  email:z.string().email("Invalid email format"),
  password:z.string().min(6,"Password must be atleast 6 characters long")
})