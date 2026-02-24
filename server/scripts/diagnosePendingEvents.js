import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function diagnose() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected! ✅");

        // Import models
        const { default: User } = await import("../models/User.js");
        const { default: Event } = await import("../models/Event.js");

        console.log("Fetching all events...");
        const events = await Event.find().populate("organizer", "name email");

        console.log(`Found ${events.length} events total.`);
        events.forEach(e => {
            console.log(`- ${e.title} [Status: ${e.status || "UNDEFINED"}] (Organizer: ${e.organizer ? e.organizer.email : "NULL"})`);
        });

        process.exit(0);
    } catch (error) {
        console.error("DIAGNOSTIC ERROR ❌:", error);
        process.exit(1);
    }
}

diagnose();
