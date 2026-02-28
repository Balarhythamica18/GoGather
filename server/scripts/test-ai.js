import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const geminiKey = process.env.GEMINI_KEY?.trim();
const groqKey = process.env.GROQ_API_KEY?.trim();

async function testGemini() {
    if (!geminiKey) {
        console.log("❌ Gemini Key: MISSING");
        return;
    }
    try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("✅ Gemini Success:", response.text().substring(0, 50) + "...");
    } catch (error) {
        console.error("❌ Gemini Failure:", error);
    }
}

async function testGroq() {
    if (!groqKey) {
        console.log("❌ Groq Key: MISSING");
        return;
    }
    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: "Hello, are you working?" }]
        }, {
            headers: { Authorization: `Bearer ${groqKey}` }
        });
        console.log("✅ Groq Success:", response.data.choices[0].message.content.substring(0, 50) + "...");
    } catch (error) {
        console.error("❌ Groq Failure:", error.response?.data || error.message);
    }
}

console.log("--- Testing AI Keys ---");
await testGemini();
await testGroq();
console.log("------------------------");
