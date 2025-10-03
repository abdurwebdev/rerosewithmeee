require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const cookieParser = require('cookie-parser');
const connectDB = require('./db/db');
const cors = require('cors')
connectDB();

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(morgan('dev'));
app.use(cors({
  origin: [process.env.VITE_FRONTEND_URL, "http://localhost:5173"], // allow frontend + dev
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));


app.get("/",(req,res)=>{
  res.send("Hello");
})

app.get("/test",(req,res)=>{
  res.send("Hello World");
})
app.use(cookieParser());
app.use("/api/auth",  authRoutes);
app.use("/api/user",  userRoutes);

// app.listen(process.env.PORT,()=>{
//   console.log(`Port is running ${process.env.PORT}`)
// })

module.exports = app;