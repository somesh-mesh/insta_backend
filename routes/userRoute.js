import express from "express";
import { register, login, logout,generateOtp,verifyOtp,resetPassword } from "../controllers/usercontroller.js";
import isAuthenticated from "../middlewares/isAuthenticate.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", isAuthenticated, logout);
router.post("/generateOtp", generateOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/resetPassword", resetPassword);
export default router;
