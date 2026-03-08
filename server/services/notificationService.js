import { sendEmail } from "../utils/emailUtility.js";

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
                    <div style="background-color: #0b0f5b; color: white; padding: 24px; text-align: center;">
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
                            <a href="https://gogather-client.onrender.com/login" style="background-color: #0b0f5b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Event</a>
                        </div>
                    </div>
                </div>
            `,
        };

        await sendEmail(mailOptions);
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
                            <a href="https://gogather-client.onrender.com/login" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Dashboard</a>
                        </div>
                    </div>
                </div>
            `,
        };

        await sendEmail(mailOptions);
        console.log(`Notification sent to organizer: ${organizerEmail}`);
    } catch (error) {
        console.error("Error sending organizer notification:", error);
    }
};

/**
 * Notify Organizer when they are approved by admin to publish events directly
 */
export const sendOrganizerApprovalEmail = async (organizerEmail, organizerName) => {
    try {
        const mailOptions = {
            from: `"GoGather Team" <${process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com"}>`,
            to: organizerEmail,
            subject: "Your Account is Verified! 🎉 Start Publishing Events",
            html: `
                <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(180deg, #0b0f5b 0%, #0a0d4a 100%); color: white; padding: 32px 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎊 Congratulations, ${organizerName}!</h1>
                    </div>
                    <div style="padding: 32px 24px; background-color: #ffffff;">
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your account has been <strong>verified and approved</strong> by the GoGather admin team!</p>
                        
                        <div style="background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%); padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #0b0f5b;">
                            <h3 style="margin: 0 0 12px 0; color: #0b0f5b;">✨ What's New?</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #64748b;">
                                <li style="margin: 8px 0;"><strong>Direct Publishing:</strong> Your events will be published directly without waiting for admin approval</li>
                                <li style="margin: 8px 0;"><strong>Immediate Visibility:</strong> Events appear instantly on the GoGather platform</li>
                                <li style="margin: 8px 0;"><strong>Full Access:</strong> Create and manage unlimited events</li>
                            </ul>
                        </div>

                        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 24px;">You're now ready to create and publish amazing events on GoGather. Start by logging into your organizer dashboard and creating your first event!</p>
                        
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="https://gogather-client.onrender.com/organizer/dashboard" style="background: linear-gradient(180deg, #0b0f5b 0%, #0a0d4a 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Go to Dashboard</a>
                        </div>

                        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="color: #94a3b8; font-size: 13px; margin: 0;">If you have any questions, feel free to contact our support team.</p>
                        </div>
                    </div>
                    <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; font-size: 12px; margin: 0;">GoGather © 2026 | All Rights Reserved</p>
                    </div>
                </div>
            `,
        };

        await sendEmail(mailOptions);
        console.log(`Approval notification sent to organizer: ${organizerEmail}`);
    } catch (error) {
        console.error("Error sending organizer approval notification:", error);
        throw error;
    }
};

/**
 * Notify Organizer when their approval is revoked
 */
export const sendOrganizerRejectionEmail = async (organizerEmail, organizerName) => {
    try {
        const mailOptions = {
            from: `"GoGather Team" <${process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com"}>`,
            to: organizerEmail,
            subject: "Update to Your Account Status - Action Required",
            html: `
                <div style="font-family: 'Outfit', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); color: white; padding: 32px 24px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Account Status Update</h1>
                    </div>
                    <div style="padding: 32px 24px; background-color: #ffffff;">
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Dear ${organizerName},</p>
                        
                        <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your admin verification status has been <strong>revoked</strong>. This means that your events will now require admin approval before being published.</p>
                        
                        <div style="background: linear-gradient(135deg, #fef2f2 0%, #f8fafc 100%); padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #ef4444;">
                            <h3 style="margin: 0 0 12px 0; color: #ef4444;">⚠️ What This Means</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #64748b;">
                                <li style="margin: 8px 0;"><strong>Approval Required:</strong> Events will need admin review before publishing</li>
                                <li style="margin: 8px 0;"><strong>Review Process:</strong> Allow extra time for event approval</li>
                                <li style="margin: 8px 0;"><strong>Contact Support:</strong> If you believe this is an error, please reach out</li>
                            </ul>
                        </div>

                        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 24px;">If you have questions or would like to appeal this decision, please contact our support team immediately.</p>
                        
                        <div style="text-align: center; margin-top: 32px;">
                            <a href="https://gogather-client.onrender.com/contact" style="background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Contact Support</a>
                        </div>

                        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="color: #94a3b8; font-size: 13px; margin: 0;">We're here to help and value your partnership with GoGather.</p>
                        </div>
                    </div>
                    <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; font-size: 12px; margin: 0;">GoGather © 2026 | All Rights Reserved</p>
                    </div>
                </div>
            `,
        };

        await sendEmail(mailOptions);
        console.log(`Rejection notification sent to organizer: ${organizerEmail}`);
    } catch (error) {
        console.error("Error sending organizer rejection notification:", error);
        throw error;
    }
};
