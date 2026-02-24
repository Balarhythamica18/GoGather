import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    const { name, email, password, confirmPassword, role } = req.body;

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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    res.status(201).json({ message: "Registered Successfully" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ===============================
   LOGIN ⭐ IMPORTANT FIX
=============================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set online status
    user.isOnline = true;
    await user.save();

    // ⭐ THIS FIXES YOUR SEAT ERROR
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || null,
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
      "name email role image"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: error.message });
  }
};