import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function migrate() {
    try {
        console.log("Connecting to MongoDB for migration...");
        await mongoose.connect(process.env.MONGODB_URI);

        const db = mongoose.connection.db;
        const collection = db.collection("events");

        console.log("Checking for events without status...");

        // Update documents where status field is missing OR not one of the enum values
        const res = await collection.updateMany(
            { status: { $exists: false } },
            { $set: { status: "approved" } }
        );

        console.log(`Updated ${res.modifiedCount} legacy events to 'approved'.`);

        // Force all existing events to have a status if they are 'undefined' or null
        const res2 = await collection.updateMany(
            { $or: [{ status: null }, { status: "" }] },
            { $set: { status: "pending" } }
        );
        console.log(`Updated ${res2.modifiedCount} null/empty status events to 'pending'.`);

        process.exit(0);
    } catch (error) {
        console.error("MIGRATION ERROR ❌:", error);
        process.exit(1);
    }
}

migrate();
