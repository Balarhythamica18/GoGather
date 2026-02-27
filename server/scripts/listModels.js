import "dotenv/config";
import axios from "axios";

const apiKey = process.env.GEMINI_KEY?.trim();

async function listModels() {
    console.log("Listing models for key:", apiKey ? "PRESENT" : "MISSING");
    if (!apiKey) return;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await axios.get(url);
        console.log("Available Models:");
        response.data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
    } catch (error) {
        console.error("Failed to list models.");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

listModels();
