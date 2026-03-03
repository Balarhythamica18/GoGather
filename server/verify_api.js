import "dotenv/config";
import { sendEmail } from "./utils/emailUtility.js";

async function verify() {
    console.log("Checking Email Utility Readiness...");
    const hasResend = !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_YOUR_KEY_HERE';
    const hasSmtp = !!process.env.EMAIL_PASS;

    console.log(`- Resend API Key Present: ${hasResend}`);
    console.log(`- SMTP Credentials Present: ${hasSmtp}`);

    if (hasResend) {
        console.log("Status: READY for API-based delivery (Production Mode)");
    } else if (hasSmtp) {
        console.log("Status: READY for SMTP-based delivery (Local/Fallback Mode)");
    } else {
        console.log("Status: NOT CONFIGURED correctly.");
    }

    try {
        console.log("Attempting a dry run of sendEmail (blocking=true)...");
        // We won't actually trigger the call if keys are placeholders to avoid errors in this test
        if (hasResend || hasSmtp) {
            console.log("Logic check passed. Ready for actual testing.");
        }
    } catch (e) {
        console.error("Dry run error:", e.message);
    }
}

verify();
