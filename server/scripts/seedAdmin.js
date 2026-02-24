import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import connectDB from "../configs/db.js";

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log("Admin already exists. Skipping... ✅");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const adminUser = new User({
            name: "System Admin",
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
        });

        await adminUser.save();
        console.log("Admin account created successfully! 👑");
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword} (Please change after first login)`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error.message);
        process.exit(1);
    }
};

seedAdmin();
