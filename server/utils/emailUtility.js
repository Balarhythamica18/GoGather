import nodemailer from "nodemailer";
import dns from "dns";
import axios from "axios";

// Force IPv4 for all network connections (fixes ENETUNREACH on Render/Gmail)
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

/**
 * Centralized Email Utility
 * Supports ProMailer (Render), Brevo API (Primary), Resend API (Secondary), and SMTP (Local/Backup)
 */
const adminEmail = process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com";
const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, ""); // Remove all spaces for reliability
const resendApiKey = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_YOUR_KEY_HERE' ? process.env.RESEND_API_KEY : null;

// Brevo API Config
const brevoApiKey = process.env.BREVO_API_KEY;

// ProMailer Config (For Render deployment)
const proMailerUrl = process.env.PROMAILER_API_URL;
const proMailerApiKey = process.env.PROMAILER_API_KEY;
const proMailerSmtpId = process.env.PROMAILER_SMTP_ID;

// Brevo SMTP Config (Fallback if API fails)
const brevoHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
const brevoPort = parseInt(process.env.BREVO_SMTP_PORT) || 587;
const brevoUser = process.env.BREVO_SMTP_USER;
const brevoKey = process.env.BREVO_SMTP_KEY;

// Brevo Transporter (Fallback)
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

// Gmail/Legacy SMTP Transporter (Last Fallback)
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
 * Sends an email using Brevo API (Primary), Resend API (Secondary), Brevo SMTP (Tertiary), or Gmail SMTP (Last Fallback).
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

    // 1. Try ProMailer (For Render deployment)
    if (proMailerUrl && proMailerApiKey && proMailerSmtpId) {
        try {
            if (blocking) {
                const response = await axios.post(proMailerUrl, {
                    smtpId: proMailerSmtpId,
                    to: [mailOptions.to],
                    subject: mailOptions.subject,
                    html: mailOptions.html
                }, {
                    headers: {
                        'Authorization': `Bearer ${proMailerApiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`[EMAIL SUCCESS (PROMAILER)] Sent to ${options.to}`);
                return response.data;
            } else {
                // Background execution
                axios.post(proMailerUrl, {
                    smtpId: proMailerSmtpId,
                    to: [mailOptions.to],
                    subject: mailOptions.subject,
                    html: mailOptions.html
                }, {
                    headers: {
                        'Authorization': `Bearer ${proMailerApiKey}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => console.log(`[EMAIL SUCCESS (PROMAILER-BG)] Sent to ${options.to}`))
                .catch(error => {
                    console.error(`[EMAIL ERROR (PROMAILER-BG)] Failed to send to ${options.to}:`, error.message);
                    console.log("[EMAIL INFO] ProMailer background failed. Initiating fallback chain...");

                    // Execute fallback manually in background
                    executeFallbackMethods(mailOptions, false, options.to)
                        .catch(fallbackErr => console.error("[EMAIL FATAL BG] All fallback methods failed:", fallbackErr.message));
                });
                return;
            }
        } catch (error) {
            console.error(`[EMAIL ERROR (PROMAILER)] Failed to send to ${options.to}:`, error.message);
            // Continue to fallback methods
        }
    }

    // Fallback methods grouped into a helper so background tasks can call them too
    const executeFallbackMethods = async (mailOptions, blockingFlag, recipient) => {
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
                    console.log(`[EMAIL SUCCESS (RESEND-API)] Sent to ${recipient}. ID: ${response.data.id}`);
                    return response.data;
                } catch (error) {
                    const errorMsg = error.response?.data?.message || error.message;
                    console.error(`[EMAIL ERROR (RESEND-API)] Failed to send to ${recipient}:`, errorMsg);
                    if (!brevoTransporter && !emailPass) {
                        if (blockingFlag) throw new Error(`Email delivery failed: ${errorMsg}`);
                    }
                }
            };

            if (blockingFlag) {
                const result = await sendViaApi();
                if (result) return result;
            } else {
                sendViaApi();
                return;
            }
        }

        // 3. Try Brevo API (Tertiary)
        if (brevoApiKey) {
            try {
                const brevoPayload = {
                    sender: {
                        name: "GoGather",
                        email: adminEmail
                    },
                    to: [{
                        email: mailOptions.to
                    }],
                    subject: mailOptions.subject,
                    htmlContent: mailOptions.html,
                    replyTo: mailOptions.replyTo || { email: adminEmail }
                };

                if (blockingFlag) {
                    const response = await axios.post('https://api.brevo.com/v3/smtp/email', brevoPayload, {
                        headers: {
                            'api-key': brevoApiKey,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log(`[EMAIL SUCCESS (BREVO-API)] Sent to ${recipient}. MessageID: ${response.data.messageId}`);
                    return response.data;
                } else {
                    axios.post('https://api.brevo.com/v3/smtp/email', brevoPayload, {
                        headers: {
                            'api-key': brevoApiKey,
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => console.log(`[EMAIL SUCCESS (BREVO-API-BG)] Sent to ${recipient}. MessageID: ${response.data.messageId}`))
                    .catch(error => console.error(`[EMAIL ERROR (BREVO-API-BG)] Failed to send to ${recipient}:`, error.response?.data?.message || error.message));
                    return;
                }
            } catch (error) {
                console.error(`[EMAIL ERROR (BREVO-API)] Failed to send to ${recipient}:`, error.response?.data?.message || error.message);
                if (!brevoTransporter && !emailPass) {
                    if (blockingFlag) throw error;
                }
            }
        }

        // 4. Try Brevo SMTP (Quaternary)
        if (brevoTransporter) {
            try {
                if (blockingFlag) {
                    const info = await brevoTransporter.sendMail(mailOptions);
                    console.log(`[EMAIL SUCCESS (BREVO-SMTP)] Sent to ${recipient}. MessageID: ${info.messageId}`);
                    return info;
                } else {
                    brevoTransporter.sendMail(mailOptions)
                        .then(info => console.log(`[EMAIL SUCCESS (BREVO-SMTP-BG)] Sent to ${recipient}. MessageID: ${info.messageId}`))
                        .catch(error => console.error(`[EMAIL ERROR (BREVO-SMTP-BG)] Failed to send to ${recipient}:`, error.message));
                    return;
                }
            } catch (error) {
                console.error(`[EMAIL ERROR (BREVO-SMTP)] Failed to send to ${recipient}:`, error.message);
                if (!emailPass) {
                    if (blockingFlag) throw error;
                }
            }
        }

        // 5. Try Gmail SMTP (Last Fallback)
        if (emailPass) {
            try {
                if (blockingFlag) {
                    const info = await transporter.sendMail(mailOptions);
                    console.log(`[EMAIL SUCCESS (SMTP-FALLBACK)] Sent to ${recipient}. MessageID: ${info.messageId}`);
                    return info;
                } else {
                    transporter.sendMail(mailOptions)
                        .then(info => console.log(`[EMAIL SUCCESS (SMTP-BG)] Sent to ${recipient}. MessageID: ${info.messageId}`))
                        .catch(error => console.error(`[EMAIL ERROR (SMTP-BG)] Failed to send to ${recipient}:`, error.message));
                    return;
                }
            } catch (error) {
                console.error(`[EMAIL ERROR (SMTP-FALLBACK)] Failed to send to ${recipient}:`, error.message);
                if (blockingFlag) throw error;
            }
        } else {
            console.error("[EMAIL ERROR] No delivery method configured or all methods failed.");
            if (blockingFlag) throw new Error("Email configuration missing or invalid");
        }
    };

    // Execute fallback normally for blocking calls that failed ProMailer/Brevo API synchronously
    return await executeFallbackMethods(mailOptions, blocking, options.to);
};

