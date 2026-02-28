import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Send Welcome Email to new users
 */
export const sendWelcomeEmail = async (email, name) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com",
                pass: process.env.EMAIL_PASS,
            },
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
        });

        const mailOptions = {
            from: `"GoGather Welcome" <${process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com"}>`,
            to: email,
            subject: "Welcome to GoGather! 🎟️",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6366f1; margin: 0;">GoGather</h1>
                        <p style="color: #666; font-size: 16px;">One Platform for All Your Events</p>
                    </div>
                    
                    <div style="padding: 20px; background-color: #f9f9fb; border-radius: 8px;">
                        <h2 style="color: #333; margin-top: 0; text-align: center;">Welcome Aboard, ${name}! 🎉</h2>
                        <p style="color: #555; font-size: 16px; line-height: 1.6;">
                            We're thrilled to have you join the GoGather community! Whether you're here to book the next big concert, find a local workshop, or organize your own events, you're in the right place.
                        </p>
                        
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="https://gogather-client.onrender.com/events" style="background-color: #6366f1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Explore Events</a>
                        </div>
                        
                        <p style="color: #555; font-size: 16px; line-height: 1.6;">
                            <strong>What's next?</strong><br>
                            • Browse upcoming events<br>
                            • Save your favorites<br>
                            • Manage your bookings easily
                        </p>
                    </div>
                    
                    <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} GoGather Inc. All rights reserved.</p>
                        <p>Questions? Reach out to us at gogatherticketbooking@gmail.com</p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
        return true;
    } catch (error) {
        console.error("Error sending welcome email:", error);
        return false;
    }
};
