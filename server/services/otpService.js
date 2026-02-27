import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP Email using Nodemailer
 */
export const sendOTPEmail = async (email, name, otp) => {
    try {
        console.log(`Attempting to send OTP email to ${email}...`);
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "gogatherticketbooking@gmail.com",
                pass: process.env.EMAIL_PASS,
            },
        });

        console.log("Transporter created. Sending mail...");

        const mailOptions = {
            from: `"GoGather Verification" <gogatherticketbooking@gmail.com>`,
            to: email,
            subject: "Verify Your GoGather Account 🎫",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6366f1; margin: 0;">GoGather</h1>
                        <p style="color: #666; font-size: 16px;">Secure Ticket Booking Platform</p>
                    </div>
                    
                    <div style="padding: 20px; background-color: #f9f9fb; border-radius: 8px; text-align: center;">
                        <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
                        <p style="color: #555; font-size: 16px; line-height: 1.5;">
                            Hi ${name},<br>
                            Thank you for joining GoGather! Please use the following One-Time Password (OTP) to complete your registration:
                        </p>
                        
                        <div style="margin: 30px 0; padding: 15px; background-color: #ffffff; border: 2px dashed #6366f1; display: inline-block; border-radius: 5px;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1;">${otp}</span>
                        </div>
                        
                        <p style="color: #888; font-size: 14px; margin-bottom: 0;">
                            This OTP is valid for 10 minutes. Please do not share this code with anyone.
                        </p>
                    </div>
                    
                    <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} GoGather Inc. All rights reserved.</p>
                        <p>If you didn't create an account, you can safely ignore this email.</p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
        return true;
    } catch (error) {
        console.error("Error sending verification email:", error);
        return false;
    }
};
