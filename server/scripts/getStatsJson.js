import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import connectDB from "../configs/db.js";

dotenv.config();

const fetchSystemReport = async () => {
    try {
        await connectDB();

        const stats = {
            totalUsers: await User.countDocuments(),
            organizers: await User.countDocuments({ role: "organizer" }),
            customers: await User.countDocuments({ role: "user" }),
            online: await User.countDocuments({ isOnline: true }),
            totalEvents: await Event.countDocuments(),
            totalBookings: await Booking.countDocuments(),
            confirmedBookings: await Booking.countDocuments({ status: "confirmed" })
        };

        fs.writeFileSync("stats_output.json", JSON.stringify(stats, null, 2));
        console.log("Stats written to stats_output.json");
        process.exit(0);
    } catch (error) {
        console.error("Aggregation Error:", error.message);
        process.exit(1);
    }
};

fetchSystemReport();
