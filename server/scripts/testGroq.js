import "dotenv/config";
import axios from "axios";

const groqKey = process.env.GROQ_API_KEY?.trim();

async function testGroq() {
    console.log("Testing Groq with key prefix:", groqKey?.substring(0, 10));
    if (!groqKey) {
        console.error("GROQ_API_KEY missing in .env");
        return;
    }

    try {
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "user", content: "Hi" }
            ]
        }, {
            headers: { Authorization: `Bearer ${groqKey}` }
        });
        console.log("✅ Groq Success!");
        console.log("Reply:", response.data.choices[0].message.content);
    } catch (error) {
        console.error("❌ Groq Failure:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Error Detail:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
}

testGroq();
