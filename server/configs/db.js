import mongoose from "mongoose";

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  console.log(`[DB DEBUG] MONGODB_URI type: ${typeof uri}`);

  if (!uri || uri.trim() === "") {
    console.error("❌ MONGODB_URI is empty or undefined!");
    return;
  }

  // Sanitize: Trim whitespace and remove surrounding quotes if they exist
  uri = uri.trim().replace(/^["'](.+)["']$/, '$1');

  try {
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to DB");
    });

    console.log(`Attempting to connect to MongoDB...`);
    console.log(`- URI Length: ${uri.length}`);
    console.log(`- URI Prefix (First 10 chars): "${uri.substring(0, 10)}..."`);
    
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
