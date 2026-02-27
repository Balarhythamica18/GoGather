import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_KEY?.trim();
const genAI = new GoogleGenerativeAI(apiKey);

async function testAI() {
    console.log("Testing Gemini AI with key:", apiKey ? "PRESENT" : "MISSING");
    if (!apiKey) return;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("SUCCESS! Reply:", response.text());
    } catch (error) {
        console.error("FAILURE! Error Code:", error.status);
        console.error("Error Message:", error.message);
        if (error.details) console.error("Error Details:", error.details);
    }
}

testAI();
