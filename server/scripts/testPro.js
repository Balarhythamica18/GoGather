import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_KEY?.trim();
const genAI = new GoogleGenerativeAI(apiKey);

async function testPro() {
    console.log("Testing gemini-pro...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello?");
        const response = await result.response;
        console.log("gemini-pro SUCCESS! Reply:", response.text());
    } catch (error) {
        console.error("gemini-pro FAILURE!");
        console.error("Error Message:", error.message);
    }
}

testPro();
