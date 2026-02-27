import fs from "fs";

try {
    const env = fs.readFileSync(".env", "utf8");
    const lines = env.split("\n");
    const keyLine = lines.find(l => l.startsWith("GEMINI_KEY="));
    if (keyLine) {
        const key = keyLine.split("=")[1].trim();
        console.log("Key:", key);
        console.log("Length:", key.length);
        console.log("Hex:", Buffer.from(key).toString("hex"));
    } else {
        console.log("GEMINI_KEY not found in .env");
    }
} catch (error) {
    console.error("Error reading .env:", error.message);
}
