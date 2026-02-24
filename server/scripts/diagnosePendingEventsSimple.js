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
        await mongoose.connect(process.env.MONGODB_URI);
        const Event = mongoose.model("Event", new mongoose.Schema({ title: String, status: String }));

        const events = await Event.find();
        console.log(`TOTAL_EVENTS: ${events.length}`);
        events.forEach(e => {
            console.log(`EVENT: ${e.title} | STATUS: ${e.status}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

diagnose();
