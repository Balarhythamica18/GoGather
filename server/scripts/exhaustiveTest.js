import "dotenv/config";
import axios from "axios";

const apiKey = process.env.GEMINI_KEY?.trim();
const versions = ["v1", "v1beta"];
const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-pro"
];

async function test() {
    console.log("Testing with key prefix:", apiKey?.substring(0, 7));
    if (!apiKey) {
        console.error("No API key found!");
        return;
    }

    for (const v of versions) {
        for (const model of models) {
            console.log(`\n--- Testing ${v} / ${model} ---`);
            try {
                const url = `https://generativelanguage.googleapis.com/${v}/models/${model}:generateContent?key=${apiKey}`;
                const response = await axios.post(url, {
                    contents: [{ parts: [{ text: "Hi" }] }]
                });
                console.log(`✅ SUCCESS for ${v}/${model}`);
                console.log("Response text:", response.data.candidates[0].content.parts[0].text);
                return;
            } catch (error) {
                if (error.response) {
                    console.log(`❌ ${v}/${model}: ${error.response.status} ${JSON.stringify(error.response.data.error?.message)}`);
                } else {
                    console.log(`❌ ${v}/${model}: ${error.message}`);
                }
            }
        }
    }
}

test();
