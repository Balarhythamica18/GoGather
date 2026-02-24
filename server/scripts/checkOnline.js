import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import connectDB from "../configs/db.js";

dotenv.config();

const checkOnlineStatus = async () => {
    try {
        await connectDB();

        const onlineOrganizers = await User.countDocuments({ isOnline: true, role: "organizer" });
        const onlineUsers = await User.countDocuments({ isOnline: true, role: "user" });
        const totalOnline = await User.countDocuments({ isOnline: true });

        console.log("--- REAL-TIME MONGODB DATA ---");
        console.log(`Currently Online Organizers: ${onlineOrganizers}`);
        console.log(`Currently Online Customers: ${onlineUsers}`);
        console.log(`Total Online Session: ${totalOnline}`);
        console.log("------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

checkOnlineStatus();
