import "dotenv/config";
import axios from "axios";

const apiKey = process.env.GEMINI_KEY?.trim();

async function testRest() {
    console.log("Direct REST test...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hi" }] }]
        });
        console.log("REST SUCCESS!");
    } catch (error) {
        console.error("REST FAILURE!");
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testRest();
