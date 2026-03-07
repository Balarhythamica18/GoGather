import nodemailer from "nodemailer";
import dns from "dns";
import axios from "axios";

// Force IPv4 for all network connections (fixes ENETUNREACH on Render/Gmail)
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

/**
 * Centralized Email Utility
 * Supports both Resend API (Recommended for Production) and SMTP (Local/Backup)
 */
const adminEmail = process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com";
const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, ""); // Remove all spaces for reliability
const resendApiKey = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_YOUR_KEY_HERE' ? process.env.RESEND_API_KEY : null;

// SMTP Transporter (Fallback)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: adminEmail,
        pass: emailPass,
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    dnsTimeout: 10000,
    family: 4 // Force IPv4 to prevent ENETUNREACH on IPv6-only environments like Render
});

// Verify SMTP connection configuration on startup (if not using API)
if (!resendApiKey) {
    if (emailPass) {
        transporter.verify(function (error, success) {
            if (error) {
                console.error("[EMAIL ERROR] SMTP Connection Verification Failed:", error.message);
            } else {
                console.log("[EMAIL SUCCESS] SMTP Server is ready for local/fallback use");
            }
        });
    } else {
        console.warn("[EMAIL WARNING] Both RESEND_API_KEY and EMAIL_PASS are missing! Email functionality will fail.");
    }
} else {
    console.log("[EMAIL INFO] Resend API detected. Using API-based delivery for production reliability.");
}

/**
 * Sends an email using either Resend API or SMTP.
 * 
 * @param {Object} options - Email options (to, subject, html, replyTo, etc.)
 * @param {boolean} blocking - If true, awaits the sendMail call. Default: true.
 * @returns {Promise|void}
 */
export const sendEmail = async (options, blocking = true) => {
    const mailOptions = {
        from: `GoGather <onboarding@resend.dev>`, // Resend default for unverified domains
        ...options
    };

    // If a specific adminEmail is set and we're not using Resend's default, use it
    if (!resendApiKey) {
        mailOptions.from = `"GoGather" <${adminEmail}>`;
    } else if (process.env.RESEND_FROM_EMAIL) {
        mailOptions.from = process.env.RESEND_FROM_EMAIL;
    }

    // --- API Sending (Resend) with SMTP Fallback ---
    if (resendApiKey) {
        const sendViaApi = async () => {
            try {
                const response = await axios.post('https://api.resend.com/emails', {
                    from: mailOptions.from,
                    to: mailOptions.to,
                    subject: mailOptions.subject,
                    html: mailOptions.html,
                    reply_to: mailOptions.replyTo || mailOptions.reply_to
                }, {
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`[EMAIL SUCCESS (API)] Sent to ${options.to}. ID: ${response.data.id}`);
                return response.data;
            } catch (error) {
                const errorMsg = error.response?.data?.message || error.message;
                console.error(`[EMAIL ERROR (API)] Failed to send to ${options.to}:`, errorMsg);

                // If API fails and we have SMTP credentials, fall back to SMTP
                if (emailPass) {
                    console.log(`[EMAIL INFO] Falling back to SMTP for ${options.to}`);
                    try {
                        const smtpResponse = await transporter.sendMail({
                            ...mailOptions,
                            from: `"GoGather" <${adminEmail}>` // Use admin email for SMTP
                        });
                        console.log(`[EMAIL SUCCESS (SMTP-FALLBACK)] Sent to ${options.to}. MessageID: ${smtpResponse.messageId}`);
                        return smtpResponse;
                    } catch (smtpError) {
                        console.error(`[EMAIL ERROR (SMTP-FALLBACK)] Failed to send to ${options.to}:`, smtpError.message);
                        if (blocking) throw new Error(`Email delivery failed via both API and SMTP: ${smtpError.message}`);
                    }
                } else {
                    console.error(`[EMAIL ERROR] No SMTP fallback available for ${options.to}`);
                    if (blocking) throw new Error(`Email API failure: ${errorMsg}`);
                }
            }
        };

        if (blocking) return await sendViaApi();
        sendViaApi();
        return;
    }

    // --- SMTP Sending (Fallback) ---
    if (!emailPass) {
        console.error("[EMAIL ERROR] No delivery method configured (Missing RESEND_API_KEY or EMAIL_PASS)");
        if (blocking) throw new Error("Email configuration missing");
        return;
    }

    if (blocking) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`[EMAIL SUCCESS (SMTP)] Sent to ${options.to}. MessageID: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error(`[EMAIL ERROR (SMTP)] Failed to send to ${options.to}:`, error.message);
            throw error;
        }
    } else {
        // Fire and forget
        transporter.sendMail(mailOptions)
            .then(info => console.log(`[EMAIL SUCCESS (SMTP-BG)] Sent to ${options.to}. MessageID: ${info.messageId}`))
            .catch(error => console.error(`[EMAIL ERROR (SMTP-BG)] Failed to send to ${options.to}:`, error.message));
    }
};

export default { sendEmail };

