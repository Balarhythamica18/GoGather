import "dotenv/config";
import nodemailer from "nodemailer";

const emailPass = process.env.EMAIL_PASS?.trim();
const adminEmail = process.env.ADMIN_EMAIL?.trim() || "gogatherticketbooking@gmail.com";

async function testEmail() {
    if (!emailPass) {
        console.log("❌ EMAIL_PASS: MISSING");
        return;
    }
    console.log(`Attempting to send test email from ${adminEmail}...`);
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: adminEmail,
                pass: emailPass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });

        const mailOptions = {
            from: `"GoGather Test" <${adminEmail}>`,
            to: adminEmail, // Send to self
            subject: "GoGather Email Test 🎫",
            text: "This is a test email from the GoGather server. If you receive this, your EMAIL_PASS is correct!",
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email Success! Message ID:", info.messageId);
    } catch (error) {
        console.error("❌ Email Failure:", error.message);
        if (error.message.includes("Invalid login")) {
            console.log("👉 TIP: Ensure your Gmail 'App Password' is correct and 2FA is enabled.");
        }
    }
}

testEmail();
