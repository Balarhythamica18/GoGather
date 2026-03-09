import mongoose from "mongoose";

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in environment variables!");
    return;
  }

  // Sanitize: Trim whitespace and remove surrounding quotes if they exist
  uri = uri.trim().replace(/^["'](.+)["']$/, '$1');

  try {
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to DB");
    });

    console.log(`Attempting to connect to MongoDB (URI Length: ${uri.length})...`);
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    // Log helpful hint for "Invalid scheme"
    if (error.message.includes("Invalid scheme")) {
      console.error("👉 TIP: Check for leading spaces or typos in your Render Environment Variables (MONGODB_URI).");
    }
    process.exit(1);
  }
};

export default connectDB;
