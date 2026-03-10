import express from "express";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import User from "../models/User.js"; // if needed
import QRCode from "qrcode"; // npm install qrcode
import authMiddleware from "../middleware/authMiddleware.js";
import dns from "dns";
import { sendEmail } from "../utils/emailUtility.js";


const router = express.Router();

// 1️⃣ Get booked seats for a seat-based event
router.get("/seats/:eventId", async (req, res) => {
  const { eventId } = req.params;
  try {
    const bookings = await Booking.find({ eventId, status: "confirmed" });
    const bookedSeats = bookings.flatMap(b => b.seats);

    // Map each seat to its vibe for the heatmap visualization
    const seatVibes = {};
    bookings.forEach(b => {
      if (b.vibe) {
        b.seats.forEach(seat => {
          seatVibes[seat] = b.vibe;
        });
      }
    });

    res.json({ bookedSeats, seatVibes });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch booked seats" });
  }
});

// 1.1️⃣ Get bookings for the logged-in user
router.get("/my-bookings", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user.id
    }).populate("eventId").sort({ createdAt: -1 });

    // Transform to match front-end expectations if necessary
    const formattedBookings = bookings.map(b => ({
      ...b._doc,
      event: b.eventId // MyBookings.jsx expects booking.event
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error("Fetch my bookings error:", error);
    res.status(500).json({ error: "Failed to fetch your bookings" });
  }
});

// 2️⃣ Create a booking (only for paid events)
router.post("/create-payment", async (req, res) => {
  const { userId, eventId, seats, ticketCount, amount, vibe } = req.body;

  try {
    const event = await (await import("../models/Event.js")).default.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const requestedTickets = seats?.length || ticketCount || 1;
    let available = event.availableSeats;

    // 🆕 Fix for legacy/uninitialized events: 
    // If availableSeats is 0 or undefined, but capacity is set, 
    // and we haven't checked confirmed bookings yet, let's treat it as uninitialized.
    if ((available === undefined || available === 0) && event.capacity > 0) {
      const confirmedBookings = await Booking.find({ eventId, status: "confirmed" });
      const totalBooked = confirmedBookings.reduce((sum, b) => sum + (b.seats?.length || b.ticketCount || 1), 0);
      available = event.capacity - totalBooked;

      // Update the event record for future consistency
      event.availableSeats = available;
      await event.save();
    }

    if (available !== undefined && available < requestedTickets) {
      return res.status(400).json({ error: `Not enough seats available. Only ${available} left.` });
    }

    // 🆕 15-Minute Booking Window Logic
    if (event.time && event.month && event.date) {
      try {
        let foundMonth = -1;
        let foundDay = -1;
        let foundYear = 2026;

        if (event.month.includes("-")) {
          const [y, m] = event.month.split("-");
          foundYear = parseInt(y);
          foundMonth = parseInt(m) - 1;
        }
        const dayMatch = event.date.toString().match(/\d+/);
        if (dayMatch) foundDay = parseInt(dayMatch[0]);

        if (foundMonth !== -1 && foundDay !== -1) {
          // Construct start time as IST (+05:30)
          const mStr = String(foundMonth + 1).padStart(2, '0');
          const dStr = String(foundDay).padStart(2, '0');
          const [hours, minutes] = event.time.split(":");
          const eventStartTime = new Date(`${foundYear}-${mStr}-${dStr}T${hours}:${minutes}:00+05:30`);

          const now = new Date();
          const windowEndTime = new Date(eventStartTime.getTime() + 15 * 60 * 1000);

          if (now > windowEndTime) {
            return res.status(400).json({ error: "Booking window closed! (15 mins from start time exceeded)" });
          }
        }
      } catch (err) {
        console.error("Booking Window Check Error:", err);
      }
    }

    const finalAmount = amount;
    const discountApplied = false;

    const booking = new Booking({
      userId,
      eventId,
      seats,
      ticketCount,
      amount: finalAmount,
      discountApplied,
      vibe,
      status: "pending",
    });

    await booking.save();
    res.json({
      bookingId: booking._id,
      amount: finalAmount,
      discountApplied,
      message: "Booking initiated"
    });
  } catch (err) {
    console.error("Create Payment Error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// 3️⃣ Verify payment, generate QR code, and email professional ticket
router.post("/verify-payment", async (req, res) => {
  const { bookingId, paymentId, userEmail, paymentMethod } = req.body;

  try {
    if (!bookingId || bookingId.length !== 24) {
      return res.status(400).json({ error: "Invalid booking ID format" });
    }
    const booking = await Booking.findById(bookingId).populate("eventId");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    booking.paymentId = paymentId;
    booking.paymentMethod = paymentMethod || "simulated";
    booking.status = "confirmed";

    // Generate professional QR data
    const qrData = JSON.stringify({
      id: bookingId,
      user: booking.userId,
      event: booking.eventId?._id,
      v: "1.0"
    });
    const qrCodeBase64 = await QRCode.toDataURL(qrData);
    booking.qrCode = qrCodeBase64;

    await booking.save();

    // 🆕 Decrement availableSeats in Event
    if (booking.eventId) {
      const ticketsBooked = booking.seats?.length || booking.ticketCount || 1;
      await (await import("../models/Event.js")).default.findByIdAndUpdate(
        booking.eventId._id,
        { $inc: { availableSeats: -ticketsBooked } }
      );
      console.log(`[CAPACITY] Decremented availableSeats for event ${booking.eventId._id} by ${ticketsBooked}`);
    }

    const event = booking.eventId;

    try {
      await sendEmail({
        to: userEmail,
        subject: `Your Ticket for ${event?.title || "Event"} 🎫`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #db2777 0%, #be185d 100%); padding: 40px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">GoGather</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Your entry pass is confirmed!</p>
            </div>
            
            <div style="padding: 30px;">
              <div style="margin-bottom: 30px; text-align: center;">
                <img src="${qrCodeBase64}" alt="QR Entry Pass" style="width: 200px; height: 200px; border: 1px solid #e2e8f0; padding: 10px; border-radius: 12px;"/>
                <p style="color: #64748b; font-size: 12px; margin-top: 10px;">Show this QR at the venue for entry</p>
              </div>

              <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 15px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Booking Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #64748b;">Event:</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${event?.title}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Date & Time:</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${event?.date} at ${event?.time}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Location:</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${event?.location}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Seats:</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">${booking.seats?.join(", ") || booking.ticketCount + " Tickets"}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Amount:</td><td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">₹${booking.amount}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Booking ID:</td><td style="padding: 8px 0; text-align: right; font-family: monospace; color: #64748b;">#${booking._id.toString().slice(-8).toUpperCase()}</td></tr>
                </table>
              </div>

              <div style="text-align: center; color: #94a3b8; font-size: 14px;">
                <p>Thank you for choosing GoGather. Enjoy the show!</p>
                <div style="margin-top: 20px; font-size: 12px;">
                  &copy; 2026 GoGather Inc. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        `,
      });
      console.log(`Ticket email sent to ${userEmail} for booking ${bookingId}`);
      res.json({ message: "Payment verified, professional ticket sent!", qrCode: qrCodeBase64, booking });
    } catch (emailErr) {
      console.error("Ticket email error:", emailErr);
      res.status(500).json({
        error: "Payment verified but ticket email failed to send. Please check your Render Environment Variables for EMAIL_PASS.",
        booking
      });
    }
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// 3.1️⃣ Get attendees for an event (Organizer only)
router.get("/attendees/:eventId", authMiddleware, async (req, res) => {
  const { eventId } = req.params;
  try {
    // Fetch the event to verify authorization
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if requester is the organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access to attendee list" });
    }

    const bookings = await Booking.find({
      eventId,
      status: "confirmed"
    })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Fetch attendees error:", error);
    res.status(500).json({ error: "Failed to fetch attendees" });
  }
});

// 4️⃣ Verify Entry (QR Scan)
router.patch("/verify-entry", async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId).populate("eventId userId");
    if (!booking) return res.status(404).json({ error: "Invalid Ticket" });
    if (booking.status !== "confirmed") return res.status(400).json({ error: "Ticket not confirmed" });
    if (booking.isUsed) return res.status(400).json({ error: "Already Scanned! 🚫" });

    // Timing check: Open 1 hour before program starts
    const event = booking.eventId;
    if (event) {
      try {
        let foundMonth = -1;
        let foundDay = -1;
        let foundYear = 2026;

        if (event.month && event.month.includes("-")) {
          const [y, m] = event.month.split("-");
          foundYear = parseInt(y);
          foundMonth = parseInt(m) - 1;
        }
        if (event.date) {
          const dayMatch = event.date.toString().match(/\d+/);
          if (dayMatch) foundDay = parseInt(dayMatch[0]);
        }

        if (foundMonth !== -1 && foundDay !== -1) {
          const timeStr = event.time ? String(event.time) : "00:00";
          const eventDateTime = new Date(foundYear, foundMonth, foundDay);
          const timeParts = timeStr.match(/(\d{1,2}):(\d{2})/);
          if (timeParts) {
            eventDateTime.setHours(parseInt(timeParts[1]), parseInt(timeParts[2]), 0);
          }

          const now = new Date();
          const diffInMs = eventDateTime - now;
          const oneHourInMs = 60 * 60 * 1000;

          if (diffInMs > oneHourInMs) {
            return res.status(400).json({
              error: "Entry Not Started! ⏳",
              message: "Scanning opens 1 hour before the event starts."
            });
          }
        }
      } catch (err) {
        console.error("Error parsing date for verification timing:", err);
      }
    }

    booking.isUsed = true;
    booking.checkInTime = new Date();
    await booking.save();

    res.json({
      success: true,
      message: "Valid Entry! Allowed ✅",
      details: {
        userName: booking.userId?.name,
        eventName: booking.eventId?.title,
        seats: booking.seats?.length > 0 ? booking.seats.join(", ") : booking.ticketCount
      }
    });
  } catch (err) {
    console.error("Verify Entry Error:", err);
    res.status(500).json({ error: "Server error during verification" });
  }
});

// 5️⃣ Cancel Ticket & Process Refund
router.post("/cancel", authMiddleware, async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId).populate("eventId");
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.userId.toString() !== req.user.id) return res.status(403).json({ error: "Unauthorized access" });
    if (booking.status === "cancelled") return res.status(400).json({ error: "Booking is already cancelled" });

    const event = booking.eventId;

    // Calculate time difference for refund
    let diffInHours = 0;
    const now = new Date(); // Need now earlier for scope

    // Safely calculate time difference for refund
    if (event) {
      try {
        let foundMonth = -1;
        let foundDay = -1;
        let foundYear = 2026; // Default to 2026

        // 1. Try to parse YYYY-MM format from event.month (new format)
        if (event.month && event.month.includes("-")) {
          const [y, m] = event.month.split("-");
          foundYear = parseInt(y);
          foundMonth = parseInt(m) - 1; // 0-indexed month
        } else {
          // Fallback to month names for legacy data
          const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const monthSource = (event.month || event.date || "").toString();
          months.forEach((m, i) => {
            if (monthSource.toLowerCase().includes(m.toLowerCase())) {
              foundMonth = i;
            }
          });
        }

        // 2. Try to find day from event.date
        if (event.date) {
          const dayMatch = event.date.toString().match(/\d+/);
          if (dayMatch) {
            foundDay = parseInt(dayMatch[0]);
          }
        }

        // 3. Fallback year parsing if not from YYYY-MM
        if (event.month && !event.month.includes("-")) {
          const yearMatch = (event.title || "").toString().match(/20\d{2}/);
          if (yearMatch) {
            foundYear = parseInt(yearMatch[0]);
          }
        }

        // 4. Construct the date
        if (foundMonth !== -1 && foundDay !== -1) {
          const timeStr = event.time ? String(event.time) : "00:00";
          const eventDateTime = new Date(foundYear, foundMonth, foundDay);

          // Apply time if format is HH:MM
          const timeParts = timeStr.match(/(\d{1,2}):(\d{2})/);
          if (timeParts) {
            eventDateTime.setHours(parseInt(timeParts[1]), parseInt(timeParts[2]), 0);
          }

          if (!isNaN(eventDateTime.getTime())) {
            diffInHours = (eventDateTime - now) / (1000 * 60 * 60);
            console.log(`Refund Calc: Event=${event.title}, ParsedDate=${eventDateTime.toISOString()}, DiffHours=${diffInHours}`);
          }
        }
      } catch (dateErr) {
        console.error("Error parsing event date for cancellation:", dateErr);
        diffInHours = 0;
      }
    }

    // Check event-specific refund policy first
    let refundPercentage = 0;
    let refundPolicy = "Non-refundable (Less than 24 hours before event)";

    if (event && event.refundPolicy) {
      const policy = event.refundPolicy.toLowerCase().trim();
      if (policy.includes("no refund") || policy.includes("non-refundable")) {
        refundPercentage = 0;
        refundPolicy = "No refund (Event policy)";
      } else if (policy.includes("full refund")) {
        refundPercentage = 100;
        refundPolicy = "100% Refund (Event policy)";
      } else if (policy.includes("partial refund") || policy.includes("50%")) {
        refundPercentage = 50;
        refundPolicy = "50% Refund (Event policy)";
      } else {
        // Custom policy - try to parse percentage
        const percentMatch = event.refundPolicy.match(/(\d+)%/);
        if (percentMatch) {
          refundPercentage = parseInt(percentMatch[1]);
          refundPolicy = `${refundPercentage}% Refund (Event policy)`;
        } else {
          // If custom policy can't be parsed, default to no refund for safety
          refundPercentage = 0;
          refundPolicy = "No refund (Event policy)";
        }
      }
    } else {
      // No event-specific policy, use time-based logic
      // Grace Period: Fully refundable within 2 hours of booking, if event is >24h away
      const bookingTime = new Date(booking.createdAt);
      const hoursSinceBooking = (now - bookingTime) / (1000 * 60 * 60);

      if (hoursSinceBooking <= 2 && diffInHours >= 24) {
        refundPercentage = 100;
        refundPolicy = "100% Refund (Grace Period: within 2 hours of booking)";
      } else if (diffInHours >= 48) {
        refundPercentage = 90;
        refundPolicy = "90% Refund (Greater than 48 hours notice)";
      } else if (diffInHours >= 24) {
        refundPercentage = 50;
        refundPolicy = "50% Refund (24-48 hours notice)";
      }
    }

    const refundAmount = booking.amount > 0
      ? Math.round((booking.amount * refundPercentage) / 100 * 100) / 100
      : 0;

    // 🆕 Free Event Handling: Delete record directly and send simple email
    if (booking.amount === 0) {
      await Booking.findByIdAndDelete(bookingId);

      const user = await User.findById(booking.userId);
      const userEmail = user?.email || req.user?.email || booking?.userEmail;

      if (userEmail) {

        sendEmail({
          to: userEmail,
          subject: `Booking Cancelled: ${event?.title || "Event"} 🎟️`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #f1f5f9; padding: 25px; text-align: center;">
                <h2 style="color: #475569; margin: 0;">Booking Cancelled</h2>
                <p style="color: #64748b; margin-top: 5px;">Event entry has been removed from your history</p>
              </div>
              <div style="padding: 25px;">
                <p>Hello,</p>
                <p>Your booking for the free event <strong>${event?.title || "the event"}</strong> has been cancelled and removed from your records.</p>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 20px;">
                  Thank you for using GoGather. We hope to see you at another event soon!
                </p>
              </div>
            </div>
          `,
        }, false); // non-blocking
      }

      return res.json({
        success: true,
        message: "Free booking cancelled and record deleted for your convenience.",
        refundAmount: 0,
        isDeleted: true
      });
    }

    // Update booking status for paid bookings
    booking.status = "cancelled";
    booking.cancelledBy = "user";
    booking.refundAmount = refundAmount;
    await booking.save();

    // Fetch user to get email since it might not be in req.user
    const user = await User.findById(booking.userId);
    const userEmail = user?.email || req.user?.email || booking?.userEmail;

    if (!userEmail) {
      console.error("Cancellation Warning: User email not found. Skipping email send but completing cancellation.");
    } else {
      try {
        // 🚀 NON-BLOCKING: Send email in the background to respond faster to the user
        sendEmail({
          to: userEmail,
          subject: `Booking Cancelled: ${event?.title || "Event"} 🎟️`,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #f1f5f9; padding: 25px; text-align: center;">
                <h2 style="color: #475569; margin: 0;">Booking Cancelled</h2>
                <p style="color: #64748b; margin-top: 5px;">Your refund has been initiated</p>
              </div>
              <div style="padding: 25px;">
                <p>Hello,</p>
                <p>Your booking for <strong>${event?.title || "the event"}</strong> has been cancelled.</p>
                
                <div style="background-color: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
                  <h4 style="margin: 0 0 10px; color: #1e293b;">Refund Summary</h4>
                  <table style="width: 100%; font-size: 14px;">
                    <tr><td style="color: #64748b;">Paid Amount:</td><td style="text-align: right; font-weight: 600;">₹${booking.amount}</td></tr>
                    <tr><td style="color: #64748b;">Policy Applied:</td><td style="text-align: right; font-weight: 600;">${refundPercentage}%</td></tr>
                    <tr><td style="color: #64748b; padding-top: 8px; font-weight: 700;">Refundable:</td><td style="text-align: right; color: #10b981; font-weight: 700; padding-top: 8px;">₹${refundAmount}</td></tr>
                  </table>
                  <p style="font-size: 11px; color: #94a3b8; margin-top: 10px;">* Refunds usually reflect in 5-7 business days.</p>
                </div>

                <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                  Thank you for using GoGather. We hope to see you at another event soon!
                </p>
              </div>
            </div>
          `,
        }, false); // Set blocking to false
        console.log(`Cancellation email initiated in background for ${userEmail} (booking ${bookingId})`);
      } catch (emailErr) {
        console.error("Cancellation email initialization error:", emailErr);
        // We do not throw here, we just log the failure.
      }
    }

    // Success response regardless of email
    res.json({
      success: true,
      message: userEmail ? "Booking cancelled successfully and email sent!" : "Booking cancelled. No email sent.",
      refundAmount,
      refundPercentage,
      refundPolicy
    });
  } catch (err) {
    console.error("Cancel Booking Error Stack Trace \n\n=========\n\n:", err);
    res.status(500).json({ error: "Failed to cancel booking: " + err.message });
  }
});

// 6️⃣ Delete Cancelled Booking
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.userId.toString() !== req.user.id) return res.status(403).json({ error: "Unauthorized" });
    if (booking.status !== "cancelled") return res.status(400).json({ error: "Only cancelled bookings can be deleted" });

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking removed from history" });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

export default router;