import "dotenv/config";
import nodemailer from "nodemailer";

const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, ""); // Remove all spaces
const adminEmail = "gogatherticketbooking@gmail.com";

async function testEmail() {
    console.log(`Checking email password for ${adminEmail}...`);
    if (!emailPass || emailPass.length !== 16) {
        console.log(`❌ EMAIL_PASS is invalid. Length: ${emailPass?.length || 0}. Expected 16.`);
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: adminEmail,
                pass: emailPass,
            },
        });

        console.log("Transporter ready. Sending...");
        await transporter.sendMail({
            from: adminEmail,
            to: adminEmail,
            subject: "GoGather App Password Test",
            text: "Success!",
        });
        console.log("✅ SUCCESS! Your App Password works!");
    } catch (error) {
        console.log("❌ FAILURE:", error.message);
    }
}

testEmail();
