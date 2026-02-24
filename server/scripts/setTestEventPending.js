import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function setPending() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const collection = db.collection("events");

        console.log("Setting 'heelo' event to pending...");
        const res = await collection.updateOne(
            { title: "heelo" },
            { $set: { status: "pending" } }
        );

        console.log(`Updated ${res.modifiedCount} event(s).`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

setPending();
