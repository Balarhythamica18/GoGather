import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Event from "./models/Event.js";

dotenv.config();

const approveAll = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI not found in .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB ✅");

    // Approve all organizers
    const userResult = await User.updateMany(
      { role: "organizer", isApprovedByAdmin: false },
      { isApprovedByAdmin: true }
    );
    console.log(`Updated ${userResult.modifiedCount} organizers to approved status. ✅`);

    // Approve all pending events
    const eventResult = await Event.updateMany(
      { status: { $ne: "approved" } },
      { status: "approved" }
    );
    console.log(`Updated ${eventResult.modifiedCount} events to approved status. ✅`);

    console.log("Cleanup complete! 🚀");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
};

approveAll();
