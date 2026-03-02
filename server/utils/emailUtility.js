import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4 for all network connections (fixes ENETUNREACH on Render/Gmail)
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

/**
 * Centralized Email Utility
 */
const adminEmail = process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com";
const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, ""); // Remove all spaces for reliability

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

/**
 * Sends an email using the centralized transporter.
 * 
 * @param {Object} options - Email options (to, subject, html, etc.)
 * @param {boolean} blocking - If true, awaits the sendMail call. Default: true.
 * @returns {Promise|void}
 */
export const sendEmail = async (options, blocking = true) => {
    if (!emailPass) {
        console.error("[EMAIL ERROR] EMAIL_PASS environment variable is missing!");
        if (blocking) throw new Error("Email configuration missing");
        return;
    }

    const mailOptions = {
        from: `"GoGather" <${adminEmail}>`,
        ...options
    };

    if (blocking) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`[EMAIL SUCCESS] Sent to ${options.to}. MessageID: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error(`[EMAIL ERROR] Failed to send to ${options.to}:`, error.message);
            throw error;
        }
    } else {
        // Fire and forget
        transporter.sendMail(mailOptions)
            .then(info => console.log(`[EMAIL SUCCESS (BG)] Sent to ${options.to}. MessageID: ${info.messageId}`))
            .catch(error => console.error(`[EMAIL ERROR (BG)] Failed to send to ${options.to}:`, error.message));
    }
};

export default { sendEmail };
