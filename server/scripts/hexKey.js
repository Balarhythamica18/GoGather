import fs from 'fs';

const content = fs.readFileSync('.env', 'utf8');
const lines = content.split('\n');
const geminiLine = lines.find(l => l.startsWith('GEMINI_KEY='));

if (geminiLine) {
    const key = geminiLine.split('=')[1].trim();
    console.log(`Key found: "${key}"`);
    console.log(`Length: ${key.length}`);
    const hex = Buffer.from(key).toString('hex');
    console.log(`Hex: ${hex}`);
} else {
    console.log("GEMINI_KEY not found in .env");
}
