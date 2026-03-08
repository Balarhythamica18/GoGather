import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { generateOTP, sendOTPEmail } from "../services/otpService.js";
import { sendWelcomeEmail, sendLoginSuccessEmail } from "../services/welcomeService.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ===============================
   PASSWORD VALIDATION
=============================== */
const validatePassword = (password) => {
  const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  return regex.test(password);
};

/* ===============================
   REGISTER
=============================== */
export const register = async (req, res) => {
  try {
    const { 
      name, email, password, confirmPassword, role,
      businessName, businessWebsite, businessType, phone 
    } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        message:
          "Password must be 8 characters, include one number and one special character",
      });
    }

    if (role === "admin") {
      return res.status(403).json({ message: "Admin cannot register" });
    }

    // Professional/Business Email Validation for Organizers
    if (role === "organizer") {
      const personalEmailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
      const emailDomain = email.split("@")[1]?.toLowerCase();
      if (personalEmailDomains.includes(emailDomain)) {
        return res.status(400).json({ 
          message: "Organizers must register with a professional/business email address. Personal emails like @gmail.com are not allowed for organizers." 
        });
      }

      if (!businessName || !businessWebsite || !phone) {
        return res.status(400).json({ message: "Business name, website, and phone are required for professional registration" });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = role || "user";
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      isVerified: true,
      isApprovedByAdmin: userRole === "organizer" ? false : true,
      // Professional Fields
      businessName: userRole === "organizer" ? businessName : "",
      businessWebsite: userRole === "organizer" ? businessWebsite : "",
      businessType: userRole === "organizer" ? businessType : "",
      phone: userRole === "organizer" ? phone : ""
    });

    // Send welcome email immediately
    try {
      await sendWelcomeEmail(email, name);
    } catch (e) {
      console.error("[REGISTER] Welcome email failed:", e.message);
    }

    const message = userRole === "organizer" 
      ? "Professional Registration Successful! Your account is awaiting admin approval. We will notify you once you can start publishing events."
      : "Registration Successful. Welcome to GoGather!";

    res.status(201).json({
      message,
      email,
      isVerified: true,
      role: userRole,
      isApprovedByAdmin: newUser.isApprovedByAdmin
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   LOGIN  IMPORTANT FIX
=============================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    let user = await User.findOne({ email });
    
    // Auto-create or Update Demo Organizer for development
    const isDemo = email?.trim().toLowerCase() === "demo@company.com" && password === "demo@123";
    
    if (isDemo) {
      if (!user) {
        console.log("[DEV] Creating default demo organizer account...");
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
          name: "Demo Organization",
          email: "demo@company.com",
          password: hashedPassword,
          role: "organizer",
          isVerified: true,
          isApprovedByAdmin: true,
          businessName: "Demo Company",
          businessWebsite: "https://company.com",
          phone: "1234567890"
        });
      } else {
        console.log("[DEV] Force-approving demo organizer account...");
        user.isVerified = true;
        user.isApprovedByAdmin = true;
        user.role = "organizer";
        await user.save();
      }
    }

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      if (user.googleId) {
        return res.status(400).json({
          message: "Invalid credentials. This account is linked with Google. Please use 'Continue with Google' or reset your password if you haven't set one.",
        });
      }
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set online status
    user.isOnline = true;
    await user.save();

    // Handle First-time Welcome Email
    if (user.firstLogin) {
      console.log(`[LOGIN] First login for ${user.email}. Sending welcome email.`);
      try {
        await sendWelcomeEmail(user.email, user.name);
        user.firstLogin = false;
        await user.save();
      } catch (e) {
        console.error("[LOGIN] Welcome email failed:", e.message);
      }
    } else {
      console.log(`[LOGIN] Attempting to send login success email to ${user.email}`);
      try {
        await sendLoginSuccessEmail(user.email, user.name);
      } catch (e) {
        console.error("[LOGIN] Login success email failed:", e.message);
      }
    }

    // Check if user has any confirmed bookings
    const Booking = (await import("../models/Booking.js")).default;
    const hasBooked = await Booking.exists({ userId: user._id, status: "confirmed" });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || null,
        hasBooked: !!hasBooked,
        isApprovedByAdmin: user.isApprovedByAdmin
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   GET CURRENT USER
=============================== */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select(
      "name email role image isApprovedByAdmin"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user has any confirmed bookings
    const Booking = (await import("../models/Booking.js")).default;
    const hasBooked = await Booking.exists({ userId, status: "confirmed" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      hasBooked: !!hasBooked,
      isApprovedByAdmin: user.isApprovedByAdmin
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   UPDATE PROFILE
=============================== */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { email, name, password, currentPassword } = req.body;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    const nameChanged = name && name !== user.name;
    const emailChanged = email && email !== user.email;

    // Handle Name Update
    if (name) user.name = name;

    // Handle Email Update
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // Handle Password Update
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to set a new one" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Current password incorrect" });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({
          message: "New password must be 8 characters, include one number and one special character",
        });
      }

      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Sync changes to existing events if name or email changed
    if (nameChanged || emailChanged) {
      try {
        const Event = (await import("../models/Event.js")).default;
        const updateData = {};
        if (nameChanged) updateData["organizerDetails.name"] = name;
        if (emailChanged) updateData["organizerDetails.contactEmail"] = email;

        await Event.updateMany(
          { organizer: userId },
          { $set: updateData }
        );
      } catch (syncError) {
        console.error("Failed to sync profile change to events:", syncError);
        // We don't fail the profile update if sync fails, but we log it
      }
    }

    res.json({
      message: "Profile updated successfully ✅",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      }
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   DELETE ACCOUNT (PERMANENT)
=============================== */
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Delete Bookings made by this user
    // We import models dynamically to avoid circular dependencies if any
    const Booking = (await import("../models/Booking.js")).default;
    await Booking.deleteMany({ user: userId });

    // 2. If Organizer, delete Events created by this user
    if (user.role === "organizer") {
      const Event = (await import("../models/Event.js")).default;
      await Event.deleteMany({ organizer: userId });
    }

    // 3. Delete the User
    await User.findByIdAndDelete(userId);

    res.json({ message: "Account deleted permanently ✅. We're sad to see you go!" });

  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: error.message });
  }
};
/* ===============================
   VERIFY OTP
=============================== */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    if (password) {
      if (!validatePassword(password)) {
        return res.status(400).json({
          message:
            "Password must be 8 characters, include one number and one special character",
        });
      }
      user.password = await bcrypt.hash(password, 10);
      user.isPasswordSet = true;
    }

    await user.save();

    // Welcome email moved to first login

    res.json({ message: "Email verified successfully ✅. You can now login." });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   RESEND OTP
=============================== */
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailSent = await sendOTPEmail(user.email, user.name, otp);

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send OTP. Please check your Render Environment Variables for EMAIL_PASS." });
    }

    res.json({ message: "OTP sent successfully to your email ✅" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   GOOGLE LOGIN
=============================== */
export const googleLogin = async (req, res) => {
  console.log(">>> Google Login hit - V2 (Verification required for new users)");
  try {
    const { token, role } = req.body; // role is only needed for new accounts

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, sub: googleId, picture } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      // Check for Professional Email if registering as Organizer via Google
      if (role === "organizer") {
        const personalEmailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
        const emailDomain = email.split("@")[1]?.toLowerCase();
        if (personalEmailDomains.includes(emailDomain)) {
          return res.status(400).json({ 
            message: "Organizers must use a professional/business email address. This Google account uses a personal email domain." 
          });
        }
      }

      // Create new user if they don't exist
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

      user = await User.create({
        name,
        email,
        password: randomPassword,
        googleId,
        role: role || "user",
        isVerified: true, // Verification bypassed
        image: picture,
        isPasswordSet: false,
      });

      console.log(`[GOOGLE SIGNUP] New user created: ${email}`);
      // Welcome email moved to first login
    } else {
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }

      // Update existing user if needed
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.image) user.image = picture;
        await user.save();
      }
    }

    // Handle First-time Welcome Email (Google Login)
    if (user.firstLogin) {
      console.log(`[GOOGLE LOGIN] First login for ${user.email}. Sending welcome email.`);
      try {
        await sendWelcomeEmail(user.email, user.name);
        user.firstLogin = false;
        await user.save();
      } catch (e) {
        console.error("[GOOGLE LOGIN] Welcome email failed:", e.message);
      }
    } else {
      // Send login success email
      try {
        await sendLoginSuccessEmail(user.email, user.name);
      } catch (e) {
        console.error("[GOOGLE LOGIN] Login success email failed:", e.message);
      }
    }

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set online status
    user.isOnline = true;
    await user.save();

    // Check bookings
    const Booking = (await import("../models/Booking.js")).default;
    const hasBooked = await Booking.exists({ userId: user._id, status: "confirmed" });

    res.json({
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || null,
        hasBooked: !!hasBooked,
      },
    });

  } catch (error) {
    console.error("Google Login error:", error);
    res.status(500).json({ message: "Google Authentication failed" });
  }
};

/* ===============================
   FORGOT PASSWORD
=============================== */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailSent = await sendOTPEmail(user.email, user.name, otp);

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send reset code. Please check your Render Environment Variables for EMAIL_PASS." });
    }

    res.json({ message: "Password reset code sent successfully to your email ✅" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   RESET PASSWORD
=============================== */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: "Password must be 8 characters, include one number and one special character",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;
    user.isPasswordSet = true;
    await user.save();

    res.json({ message: "Password reset successfully ✅. You can now login with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
};

