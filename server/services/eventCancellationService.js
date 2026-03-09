import { sendEmail } from "../utils/emailUtility.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import { calculateRefund } from "../utils/refundCalculator.js";

/**
 * Professional Event Cancellation Handler
 * Handles all bookings when an event is cancelled/deleted
 */
export const handleEventCancellation = async (
  eventId,
  cancellationReason = "cancelled",
  organizerMessage = "",
  organizerId = null
) => {
  try {
    console.log(`[EVENT CANCELLATION] Starting cancellation for event: ${eventId}`);

    // 1. Find all confirmed bookings for this event
    const affectedBookings = await Booking.find({
      eventId: eventId,
      status: { $in: ["confirmed", "pending"] }
    }).populate("userId eventId");

    if (affectedBookings.length === 0) {
      console.log(`[EVENT CANCELLATION] No bookings found for event ${eventId}`);
      return {
        success: true,
        affectedUsers: 0,
        emailsSent: 0,
        refundsProcessed: 0,
        totalRefundAmount: 0
      };
    }

    console.log(`[EVENT CANCELLATION] Found ${affectedBookings.length} affected bookings`);

    let emailsSent = 0;
    let refundsProcessed = 0;
    let totalRefundAmount = 0;
    const affectedEmails = [];

    // 2. Process each booking
    for (const booking of affectedBookings) {
      try {
        const user = booking.userId;
        const event = booking.eventId;

        if (!user || !user.email) {
          console.warn(`[EVENT CANCELLATION] User not found for booking ${booking._id}`);
          continue;
        }

        // 3. Process refund based on professional centralized logic (Force 100% for organizer cancellation)
        const { amount: refundAmount, policyName: refundPolicyApplied } = calculateRefund(booking, event, true);
        console.log(`[EVENT CANCELLATION] Applied ${refundPolicyApplied} for booking ${booking._id}: ₹${refundAmount}`);

        // 4. Update booking status
        booking.status = "cancelled";
        booking.refundAmount = refundAmount;
        booking.cancellationReason = cancellationReason;
        booking.cancelledBy = "organizer";
        await booking.save();

        if (refundAmount > 0) {
          refundsProcessed++;
          totalRefundAmount += refundAmount;
        }

        // 5. Send cancellation email to user
        const emailSent = await sendEventCancellationEmail({
          userEmail: user.email,
          userName: user.name,
          eventTitle: event?.title || "Event",
          eventDate: event?.date,
          eventTime: event?.time,
          bookingAmount: booking.amount,
          refundAmount: refundAmount,
          bookingId: booking._id.toString().slice(-8).toUpperCase(),
          cancellationReason: cancellationReason,
          organizerMessage: organizerMessage,
          seats: booking.seats?.join(", "),
          ticketCount: booking.ticketCount
        });

        if (emailSent) {
          emailsSent++;
          affectedEmails.push(user.email);
        }
      } catch (bookingError) {
        console.error(
          `[EVENT CANCELLATION] Error processing booking ${booking._id}:`,
          bookingError.message
        );
        // Continue with next booking even if one fails
      }
    }

    console.log(`[EVENT CANCELLATION] Processed ${affectedBookings.length} bookings`);
    console.log(`[EVENT CANCELLATION] Emails sent: ${emailsSent}, Refunds processed: ${refundsProcessed}`);

    return {
      success: true,
      affectedUsers: affectedBookings.length,
      emailsSent: emailsSent,
      refundsProcessed: refundsProcessed,
      totalRefundAmount: totalRefundAmount,
      affectedEmails: affectedEmails
    };
  } catch (error) {
    console.error("[EVENT CANCELLATION] Fatal error:", error.message);
    throw error;
  }
};

/**
 * Send Professional Cancellation Email to User
 */
const sendEventCancellationEmail = async (details) => {
  try {
    const {
      userEmail,
      userName,
      eventTitle,
      eventDate,
      eventTime,
      bookingAmount,
      refundAmount,
      bookingId,
      cancellationReason,
      organizerMessage,
      seats,
      ticketCount
    } = details;

    // Determine email template based on cancellation reason
    let reasonText = "";
    let reasonColor = "#ef4444"; // red

    switch (cancellationReason.toLowerCase()) {
      case "postponed":
      case "rescheduled":
        reasonText = "This event has been rescheduled.";
        reasonColor = "#f97316"; // orange
        break;
      case "admin-action":
        reasonText = "This event has been removed by the admin team.";
        reasonColor = "#ef4444"; // red
        break;
      default: // "cancelled"
        reasonText = "This event has been cancelled by the organizer.";
        reasonColor = "#ef4444"; // red
    }

    const isFreeEvent = bookingAmount === 0;
    const seatsInfo = seats ? seats : `${ticketCount} Ticket${ticketCount > 1 ? "s" : ""}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <!-- HEADER -->
        <div style="background: linear-gradient(135deg, ${reasonColor} 0%, ${reasonColor}dd 100%); padding: 40px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">⚠️ Event ${cancellationReason === "postponed" ? "Rescheduled" : "Cancelled"}</h1>
          <p style="margin: 8px 0 0; opacity: 0.95; font-size: 14px;">We regret to inform you of this change</p>
        </div>

        <!-- MAIN CONTENT -->
        <div style="padding: 35px;">
          <p style="margin: 0 0 20px; font-size: 16px; color: #1e293b;">Hello <strong>${userName}</strong>,</p>

          <p style="margin: 0 0 20px; line-height: 1.6; color: #475569;">
            ${reasonText}
          </p>

          <!-- EVENT DETAILS -->
          <div style="background-color: #f8fafc; border-left: 4px solid ${reasonColor}; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">Event Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Event:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${eventTitle}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date & Time:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${eventDate} at ${eventTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Seats/Tickets:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${seatsInfo}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Booking ID:</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace; color: #64748b; font-size: 13px;">#${bookingId}</td>
              </tr>
            </table>
          </div>

          <!-- REFUND INFORMATION -->
          ${refundAmount > 0 ? `
          <div style="background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%); border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #15803d; font-size: 16px;">✅ Refund Processed</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #475569; font-size: 14px;">Amount Paid:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">₹${bookingAmount}</td>
              </tr>
              <tr style="border-top: 1px solid #86efac;">
                <td style="padding: 8px 0; color: #15803d; font-size: 14px; font-weight: 600; padding-top: 10px;">Refund Amount:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #15803d; padding-top: 10px;">₹${refundAmount}</td>
              </tr>
            </table>
            <p style="margin: 12px 0 0; color: #15803d; font-size: 12px; line-height: 1.5;">
              📌 <strong>Refund Timeline:</strong> Your money will be refunded within 2-3 business days to your original payment method.
            </p>
          </div>
          ` : `
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 25px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Note:</strong> This was a free event, so no refund is applicable. Your booking record has been removed.
            </p>
          </div>
          `}

          <!-- ORGANIZER MESSAGE -->
          ${organizerMessage ? `
          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 25px 0;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Organizer's Message</p>
            <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6; font-style: italic;">
              "${organizerMessage}"
            </p>
          </div>
          ` : ""}

          <!-- SUPPORT -->
          <div style="background-color: #f0f9ff; border-radius: 8px; padding: 16px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; color: #0369a1; font-weight: 600; font-size: 14px;">Need Help?</p>
            <p style="margin: 0; color: #0c4a6e; font-size: 13px;">
              Contact our support team at <strong>support@gogather.com</strong> or reply to this email
            </p>
          </div>

          <!-- FOOTER -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 13px;">
              Thank you for your understanding. We're committed to bringing you amazing events.
            </p>
            <p style="margin: 8px 0 0; color: #cbd5e1; font-size: 11px;">
              © 2026 GoGather Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: userEmail,
      subject: `Event ${cancellationReason === "postponed" ? "Rescheduled" : "Cancelled"}: ${eventTitle}`,
      html: htmlContent
    });

    console.log(`[EVENT CANCELLATION EMAIL] Sent to ${userEmail} for event ${eventTitle}`);
    return true;
  } catch (error) {
    console.error(
      `[EVENT CANCELLATION EMAIL] Failed to send to ${details.userEmail}:`,
      error.message
    );
    return false;
  }
};

/**
 * Notify Organizer of Cancellation Actions
 */
export const notifyOrganizerOfCancellation = async (
  organizerEmail,
  organizerName,
  eventTitle,
  affectedCount,
  cancellationResult
) => {
  try {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 35px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px;">Event Deletion Processed</h1>
          <p style="margin: 8px 0 0; opacity: 0.95; font-size: 13px;">Cancellation notifications sent to attendees</p>
        </div>

        <div style="padding: 30px;">
          <p style="margin: 0 0 15px; font-size: 15px; color: #1e293b;">Hello <strong>${organizerName}</strong>,</p>

          <p style="margin: 0 0 20px; line-height: 1.6; color: #475569;">
            Your event "<strong>${eventTitle}</strong>" has been successfully deleted from the system. Below is a summary of actions taken.
          </p>

          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px; color: #1e293b;">Cancellation Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Total Affected Tickets:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${affectedCount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Notifications Sent:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${cancellationResult.emailsSent}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Refunds Processed:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #10b981;">₹${cancellationResult.totalRefundAmount || 0}</td>
              </tr>
            </table>
          </div>

          <p style="margin: 20px 0; color: #475569; font-size: 14px; line-height: 1.6;">
            All attendees have been professionally notified of the cancellation and refunds (if applicable) have been processed. They should see the funds in their account within 2-3 business days.
          </p>

          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 14px; margin: 20px 0;">
            <p style="margin: 0; color: #7f1d1d; font-size: 13px;">
              <strong>Note:</strong> This action cannot be undone. The event has been permanently deleted from the system.
            </p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="https://gogather-client.onrender.com/dashboard" style="background-color: #f59e0b; color: white; padding: 11px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
              Back to Dashboard
            </a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; color: #94a3b8; font-size: 13px;">
              © 2026 GoGather Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: organizerEmail,
      subject: `Event Deleted: ${eventTitle} - Attendee Notifications Sent`,
      html: htmlContent
    });

    console.log(`[ORGANIZER NOTIFICATION] Sent to ${organizerEmail}`);
  } catch (error) {
    console.error("[ORGANIZER NOTIFICATION] Failed:", error.message);
  }
};

export default {
  handleEventCancellation,
  notifyOrganizerOfCancellation
};
