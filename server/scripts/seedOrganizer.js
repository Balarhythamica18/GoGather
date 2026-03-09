import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import connectDB from "../configs/db.js";

dotenv.config();

const seedOrganizer = async () => {
    try {
        await connectDB();

        const email = "test@company.com";
        const password = "test@123";
        const name = "Test Organizer";

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("User already exists. Updating to verified organizer status... 🔄");
            existingUser.role = "organizer";
            existingUser.isVerified = true;
            existingUser.isApprovedByAdmin = true;
            await existingUser.save();
            console.log("User status updated successfully! ✅");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const organizerUser = new User({
            name,
            email,
            password: hashedPassword,
            role: "organizer",
            isVerified: true,
            isApprovedByAdmin: true,
            businessName: "Test Company",
            businessWebsite: "https://company.com",
            phone: "1234567890",
            businessType: "Entertainment",
            businessDescription: "Default test organizer account"
        });

        await organizerUser.save();
        console.log("Organizer account created successfully! 🏢");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding organizer:", error.message);
        process.exit(1);
    }
};

seedOrganizer();
