import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

let sendEmail;

const testTo = process.argv[2];

if (!testTo) {
    console.error("Usage: node server/scripts/testEmail.js <email-address>");
    process.exit(1);
}

const runTest = async () => {
    console.log(`Attempting to send test email to: ${testTo}`);
    console.log("Current Configuration Check:");
    console.log("- ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
    console.log("- BREVO_SMTP_USER:", process.env.BREVO_SMTP_USER ? "Set" : "Not Set");
    console.log("- BREVO_SMTP_KEY:", process.env.BREVO_SMTP_KEY ? "Set" : "Not Set");
    console.log("- RESEND_API_KEY:", process.env.RESEND_API_KEY ? "Set" : "Not Set");

    try {
        const emailUtility = await import("../utils/emailUtility.js");
        sendEmail = emailUtility.sendEmail;
        await sendEmail({
            to: testTo,
            subject: "GoGather Test Email",
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">GoGather Email Test</h2>
                    <p>This is a test email to verify that your email delivery service (Brevo/SMTP) is working correctly.</p>
                    <p>If you received this, the configuration is successful!</p>
                    <hr>
                    <small>Sent on: ${new Date().toLocaleString()}</small>
                </div>
            `
        });
        console.log("\nSuccess! Check your inbox.");
    } catch (error) {
        console.error("\nTest failed:", error.message);
    }
    
    // Give some time for async background sends if any
    setTimeout(() => process.exit(0), 2000);
};

runTest();
