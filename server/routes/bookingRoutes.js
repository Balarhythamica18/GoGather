import express from "express";
import Booking from "../models/Booking.js";
import User from "../models/User.js"; // if needed
import QRCode from "qrcode"; // npm install qrcode
import nodemailer from "nodemailer";
import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();

// 1️⃣ Get booked seats for a seat-based event
router.get("/seats/:eventId", async (req, res) => {
  const { eventId } = req.params;
  try {
    const bookings = await Booking.find({ eventId, status: "confirmed" });
    const bookedSeats = bookings.flatMap(b => b.seats);
    res.json({ bookedSeats });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch booked seats" });
  }
});

// 1.1️⃣ Get bookings for the logged-in user
router.get("/my-bookings", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      userId: req.user.id
    }).populate("eventId");

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

// 2️⃣ Create a booking with 20% discount for first-timers
router.post("/create-payment", async (req, res) => {
  const { userId, eventId, seats, ticketCount, amount } = req.body;

  try {
    // Check if this is the user's first confirmed booking
    const previousBookings = await Booking.countDocuments({ userId, status: "confirmed" });
    const isFirstBooking = previousBookings === 0;

    let finalAmount = amount;
    let discountApplied = false;

    if (isFirstBooking) {
      finalAmount = amount * 0.8; // 20% Off
      discountApplied = true;
    }

    const booking = new Booking({
      userId,
      eventId,
      seats,
      ticketCount,
      amount: finalAmount,
      discountApplied,
      status: "pending",
    });

    await booking.save();
    res.json({
      bookingId: booking._id,
      amount: finalAmount,
      discountApplied,
      message: discountApplied ? "20% first-booking discount applied! 🎉" : "Booking initiated"
    });
  } catch (err) {
    console.error("Create Payment Error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// 3️⃣ Verify payment, generate QR code, and email professional ticket
router.post("/verify-payment", async (req, res) => {
  const { bookingId, paymentId, userEmail } = req.body;

  try {
    if (!bookingId || bookingId.length !== 24) {
      return res.status(400).json({ error: "Invalid booking ID format" });
    }
    const booking = await Booking.findById(bookingId).populate("eventId");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    booking.paymentId = paymentId;
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

    // Professional HTML Email Template
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gogatherticketbooking@gmail.com",
        pass: process.env.EMAIL_PASS,
      },
    });

    const event = booking.eventId;
    const mailOptions = {
      from: `"GoGather" <gogatherticketbooking@gmail.com>`,
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
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Payment verified, professional ticket sent!", qrCode: qrCodeBase64, booking });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

// 4️⃣ Verify Entry (QR Scan)
router.patch("/verify-entry", async (req, res) => {
  const { bookingId } = req.body;

  try {
    const booking = await Booking.findById(bookingId).populate("eventId userId");
    if (!booking) return res.status(404).json({ error: "Invalid Ticket" });
    if (booking.status !== "confirmed") return res.status(400).json({ error: "Ticket not confirmed" });
    if (booking.isUsed) return res.status(400).json({ error: "Ticket already used" });

    booking.isUsed = true;
    await booking.save();

    res.json({
      success: true,
      message: "Access Granted! ✅",
      details: {
        userName: booking.userId?.name,
        eventName: booking.eventId?.title,
        seats: booking.seats?.join(", ") || booking.ticketCount
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
    // Assumes event.date is "YYYY-MM-DD" and event.time is "HH:mm"
    // Handle different dash/slash separators or Month names if possible
    let eventDateStr = event.date;
    // Replace Month names if they exist (simple check)
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach((m, i) => {
      if (eventDateStr.includes(m)) {
        eventDateStr = eventDateStr.replace(m, i + 1).replace(" ", "-");
      }
    });

    const eventDateTime = new Date(`${eventDateStr}T${event.time || "00:00"}:00`);
    const now = new Date();
    const diffInHours = (eventDateTime - now) / (1000 * 60 * 60);

    // Grace Period: Fully refundable within 2 hours of booking, if event is >24h away
    const bookingTime = new Date(booking.createdAt);
    const hoursSinceBooking = (now - bookingTime) / (1000 * 60 * 60);

    let refundPercentage = 0;
    let refundPolicy = "Non-refundable (Less than 24 hours before event)";

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

    const refundAmount = (booking.amount * refundPercentage) / 100;

    // Update booking status
    booking.status = "cancelled";
    await booking.save();

    // Send Cancellation Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gogatherticketbooking@gmail.com",
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"GoGather Support" <gogatherticketbooking@gmail.com>`,
      to: req.user.email || booking.userEmail,
      subject: `Booking Cancelled: ${event.title} 🎟️`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #f1f5f9; padding: 25px; text-align: center;">
            <h2 style="color: #475569; margin: 0;">Booking Cancelled</h2>
            <p style="color: #64748b; margin-top: 5px;">Your refund has been initiated</p>
          </div>
          <div style="padding: 25px;">
            <p>Hello,</p>
            <p>Your booking for <strong>${event.title}</strong> has been cancelled.</p>
            
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
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error("Cancellation email error:", emailErr);
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      refundAmount,
      refundPercentage,
      refundPolicy
    });
  } catch (err) {
    console.error("Cancel Booking Error:", err);
    res.status(500).json({ error: "Failed to cancel booking" });
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