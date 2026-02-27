import express from "express";
import { register, login, getCurrentUser, updateProfile, deleteAccount, verifyOTP, resendOTP, googleLogin, forgotPassword, resetPassword } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/google-login", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authMiddleware, getCurrentUser);
router.put("/update-profile", authMiddleware, updateProfile);
router.delete("/delete-account", authMiddleware, deleteAccount);

router.get("/health-check", (req, res) => {
    res.json({ status: "Auth routes are active ✅", timestamp: new Date() });
});

export default router;
