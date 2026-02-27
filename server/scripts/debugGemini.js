import axios from "axios";

const apiKey = "AIzaSyAVOt1Y4-1_nwFcda5HCldYwv4CpBIPlu0";
const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
    "gemini-1.0-pro",
    "gemini-2.0-flash"
];

async function test() {
    for (const model of models) {
        console.log(`\n--- Testing ${model} ---`);
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await axios.post(url, {
                contents: [{ parts: [{ text: "Hi" }] }]
            });
            console.log(`✅ SUCCESS for ${model}`);
            console.log("Reply:", response.data.candidates[0].content.parts[0].text);
            return; // Stop at first success
        } catch (error) {
            console.log(`❌ FAILED for ${model}`);
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
                console.log(`Error: ${JSON.stringify(error.response.data.error)}`);
            } else {
                console.log(`Message: ${error.message}`);
            }
        }
    }
}

test();
