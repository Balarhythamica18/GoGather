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

// Brevo SMTP Config
const brevoHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
const brevoPort = parseInt(process.env.BREVO_SMTP_PORT) || 587;
const brevoUser = process.env.BREVO_SMTP_USER;
const brevoKey = process.env.BREVO_SMTP_KEY;

// Brevo Transporter (Primary SMTP)
let brevoTransporter = null;
if (brevoUser && brevoKey) {
    brevoTransporter = nodemailer.createTransport({
        host: brevoHost,
        port: brevoPort,
        secure: brevoPort === 465,
        auth: {
            user: brevoUser,
            pass: brevoKey,
        },
        family: 4
    });
    console.log("[EMAIL INFO] Brevo SMTP configuration detected.");
}

// Gmail/Legacy SMTP Transporter (Fallback)
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

// Verify Brevo on startup if available
if (brevoTransporter) {
    brevoTransporter.verify((error) => {
        if (error) {
            console.error("[EMAIL ERROR] Brevo SMTP Verification Failed:", error.message);
        } else {
            console.log("[EMAIL SUCCESS] Brevo SMTP is ready.");
        }
    });
} else if (!resendApiKey && emailPass) {
    // Verify Gmail SMTP only if no Brevo and no Resend
    transporter.verify(function (error, success) {
        if (error) {
            console.error("[EMAIL ERROR] SMTP Connection Verification Failed:", error.message);
        } else {
            console.log("[EMAIL SUCCESS] SMTP Server is ready for local/fallback use");
        }
    });
}

/**
 * Sends an email using Brevo SMTP (Primary), Resend API (Secondary), or Gmail SMTP (Fallback).
 * 
 * @param {Object} options - Email options (to, subject, html, replyTo, etc.)
 * @param {boolean} blocking - If true, awaits the sendMail call. Default: true.
 * @returns {Promise|void}
 */
export const sendEmail = async (options, blocking = true) => {
    const mailOptions = {
        from: `"GoGather" <${adminEmail}>`,
        ...options
    };

    // 1. Try Brevo SMTP (Primary)
    if (brevoTransporter) {
        try {
            if (blocking) {
                const info = await brevoTransporter.sendMail(mailOptions);
                console.log(`[EMAIL SUCCESS (BREVO)] Sent to ${options.to}. MessageID: ${info.messageId}`);
                return info;
            } else {
                brevoTransporter.sendMail(mailOptions)
                    .then(info => console.log(`[EMAIL SUCCESS (BREVO-BG)] Sent to ${options.to}. MessageID: ${info.messageId}`))
                    .catch(error => console.error(`[EMAIL ERROR (BREVO-BG)] Failed to send to ${options.to}:`, error.message));
                return;
            }
        } catch (error) {
            console.error(`[EMAIL ERROR (BREVO)] Failed to send to ${options.to}:`, error.message);
            if (!resendApiKey && !emailPass) throw error;
            console.log("[EMAIL INFO] Attempting fallback methods...");
        }
    }

    // 2. Try Resend API (Secondary)
    if (resendApiKey) {
        const sendViaApi = async () => {
            try {
                const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
                const response = await axios.post('https://api.resend.com/emails', {
                    from: fromEmail,
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
                console.log(`[EMAIL SUCCESS (RESEND-API)] Sent to ${options.to}. ID: ${response.data.id}`);
                return response.data;
            } catch (error) {
                const errorMsg = error.response?.data?.message || error.message;
                console.error(`[EMAIL ERROR (RESEND-API)] Failed to send to ${options.to}:`, errorMsg);
                if (!emailPass) {
                    if (blocking) throw new Error(`Email delivery failed: ${errorMsg}`);
                }
            }
        };

        if (blocking) {
            const result = await sendViaApi();
            if (result) return result;
        } else {
            sendViaApi();
            return;
        }
    }

    // 3. Try Gmail SMTP (Fallback)
    if (emailPass) {
        try {
            if (blocking) {
                const info = await transporter.sendMail(mailOptions);
                console.log(`[EMAIL SUCCESS (SMTP-FALLBACK)] Sent to ${options.to}. MessageID: ${info.messageId}`);
                return info;
            } else {
                transporter.sendMail(mailOptions)
                    .then(info => console.log(`[EMAIL SUCCESS (SMTP-BG)] Sent to ${options.to}. MessageID: ${info.messageId}`))
                    .catch(error => console.error(`[EMAIL ERROR (SMTP-BG)] Failed to send to ${options.to}:`, error.message));
                return;
            }
        } catch (error) {
            console.error(`[EMAIL ERROR (SMTP-FALLBACK)] Failed to send to ${options.to}:`, error.message);
            if (blocking) throw error;
        }
    } else {
        console.error("[EMAIL ERROR] No delivery method configured or all methods failed.");
        if (blocking) throw new Error("Email configuration missing or invalid");
    }
};

export default { sendEmail };

