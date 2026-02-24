import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import connectDB from "../configs/db.js";

dotenv.config();

const fetchSystemReport = async () => {
    try {
        await connectDB();

        const totalUsers = await User.countDocuments();
        const organizersCount = await User.countDocuments({ role: "organizer" });
        const customersCount = await User.countDocuments({ role: "user" });
        const onlineCount = await User.countDocuments({ isOnline: true });

        const totalEvents = await Event.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });

        console.log("==========================================");
        console.log("📊 REAL-TIME MONGODB SYSTEM REPORT");
        console.log("==========================================");
        console.log(`👥 Total Registered Users: ${totalUsers}`);
        console.log(`   - Organizers: ${organizersCount}`);
        console.log(`   - Customers : ${customersCount}`);
        console.log(`🟢 Currently Online   : ${onlineCount}`);
        console.log("------------------------------------------");
        console.log(`🎫 Total Events Created: ${totalEvents}`);
        console.log(`🎟️ Total Bookings      : ${totalBookings}`);
        console.log(`✅ Confirmed Bookings  : ${confirmedBookings}`);
        console.log("==========================================");

        process.exit(0);
    } catch (error) {
        console.error("Aggregation Error:", error.message);
        process.exit(1);
    }
};

fetchSystemReport();
