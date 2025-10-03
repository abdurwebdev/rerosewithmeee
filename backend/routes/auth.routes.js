const express = require('express');
const router = express.Router();
const {registerUser,loginUser,admin} = require("../controllers/authController");
const {checkToken} = require("../middleware/authMiddleware");

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/api/admin",checkToken,admin);


module.exports = router;