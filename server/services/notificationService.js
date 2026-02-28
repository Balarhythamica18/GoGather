import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com",
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Notify Admin when a new event is created and pending approval
 */
export const sendEventPendingNotification = async (adminEmail, organizerDetails, eventDetails) => {
    try {
        const mailOptions = {
            from: `"GoGather System" <${process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com"}>`,
            to: adminEmail,
            subject: `New Event Pending Approval: ${eventDetails.title} 📢`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #ff007a; color: white; padding: 24px; text-align: center;">
                        <h1 style="margin: 0;">New Event Submission</h1>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff;">
                        <p>A new event has been submitted and requires your approval.</p>
                        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #1e293b;">${eventDetails.title}</h3>
                            <p><strong>Organizer:</strong> ${organizerDetails.name} (${organizerDetails.email})</p>
                            <p><strong>Location:</strong> ${eventDetails.location}</p>
                            <p><strong>Date:</strong> ${eventDetails.date} ${eventDetails.month}</p>
                        </div>
                        <p>Please log in to the Admin Dashboard to review and approve/reject this event.</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://gogather-client.onrender.com/admin/events" style="background-color: #ff007a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Event</a>
                        </div>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Notification sent to admin: ${adminEmail}`);
    } catch (error) {
        console.error("Error sending admin notification:", error);
    }
};

/**
 * Notify Organizer when their event status is updated
 */
export const sendEventStatusUpdateNotification = async (organizerEmail, eventTitle, status) => {
    try {
        const isApproved = status === "approved";
        const subject = isApproved ? `Your Event "${eventTitle}" has been APPROVED! 🎉` : `Update regarding your event "${eventTitle}"`;

        const mailOptions = {
            from: `"GoGather Team" <${process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com"}>`,
            to: organizerEmail,
            subject: subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: ${isApproved ? '#22c55e' : '#ef4444'}; color: white; padding: 24px; text-align: center;">
                        <h1 style="margin: 0;">Event Status Update</h1>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff;">
                        <p>Hello,</p>
                        <p>The status of your event **"${eventTitle}"** has been updated to: <strong style="color: ${isApproved ? '#22c55e' : '#ef4444'}; text-transform: uppercase;">${status}</strong>.</p>
                        
                        ${isApproved
                    ? `<p>Congratulations! Your event is now live and visible to all users on GoGather.</p>`
                    : `<p>Unfortunately, your event could not be approved at this time. Please review our guidelines or contact support for more information.</p>`
                }
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://gogather-client.onrender.com/dashboard" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Dashboard</a>
                        </div>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Notification sent to organizer: ${organizerEmail}`);
    } catch (error) {
        console.error("Error sending organizer notification:", error);
    }
};
