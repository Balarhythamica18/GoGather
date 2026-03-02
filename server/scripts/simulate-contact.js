import "dotenv/config";
import { sendEmail } from "../utils/emailUtility.js";

async function simulateContact() {
    const adminEmail = process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com";
    const testUserEmail = "testuser@example.com"; // Simulation
    const subject = "Test Inquiry " + new Date().getTime();

    console.log("--- Simulating Contact Form Submission ---");

    try {
        // 1. Email to Admin
        console.log(`Sending email to ADMIN (${adminEmail})...`);
        await sendEmail({
            from: `"Simulation User" <${adminEmail}>`,
            replyTo: testUserEmail,
            to: adminEmail,
            subject: `[SIMULATION] New Contact Query: ${subject}`,
            html: `<h2>Simulated Inquiry</h2><p>From: ${testUserEmail}</p><p>Message: This is a simulation.</p>`
        }, true);
        console.log("✅ Admin email sent.");

        // 2. Confirmation to User
        console.log(`Sending confirmation to USER (${testUserEmail})...`);
        // We'll send this to admin instead to verify it arrives, 
        // since we can't check testuser@example.com
        await sendEmail({
            to: adminEmail, // redirected for testing
            subject: "[SIMULATION] We Received Your Query",
            html: `<h2>Hello Test User,</h2><p>This is a confirmation simulation.</p>`
        }, true);
        console.log("✅ User confirmation email sent.");

        console.log("--- Simulation Completed Successfully ---");
    } catch (error) {
        console.error("❌ Simulation Failed:", error.message);
    }
}

simulateContact();
