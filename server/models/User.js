import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["user", "organizer", "admin"],
    default: "user"
  },

  image: {
    type: String,
    default: ""
  },

  isOnline: {
    type: Boolean,
    default: false
  },

  location: {
    type: String,
    default: ""
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  otp: {
    type: String,
    default: null
  },

  otpExpires: {
    type: Date,
    default: null
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true
  }

}, { timestamps: true });

export default mongoose.model("User", userSchema);
