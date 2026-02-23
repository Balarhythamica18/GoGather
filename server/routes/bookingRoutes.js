import express from "express";
import Booking from "../models/Booking.js";
import User from "../models/User.js"; // if needed
import QRCode from "qrcode"; // npm install qrcode
import nodemailer from "nodemailer";

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

// 2️⃣ Create a booking (payment placeholder)
router.post("/create-payment", async (req, res) => {
  const { userId, eventId, seats, ticketCount } = req.body;

  try {
    const booking = new Booking({
      userId,
      eventId,
      seats,
      ticketCount,
      status: "pending",
    });

    await booking.save();
    // Normally here you'd create a payment order with a gateway
    res.json({ bookingId: booking._id, message: "Payment order created (placeholder)" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// 3️⃣ Verify payment, generate QR code, and email ticket
router.post("/verify-payment", async (req, res) => {
  const { bookingId, paymentId, userEmail } = req.body;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    booking.paymentId = paymentId;
    booking.status = "confirmed";

    // Generate QR code as base64
    const qrData = `BookingID:${bookingId}|User:${booking.userId}|Event:${booking.eventId}`;
    const qrCodeBase64 = await QRCode.toDataURL(qrData);
    booking.qrCode = qrCodeBase64;

    await booking.save();

    // Send email with QR code
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gogatherticketbooking@gmail.com",
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"GoGather Ticket Booking" <gogatherticketbooking@gmail.com>`,
      to: userEmail,
      subject: "Your Ticket - GoGather 🎫",
      html: `
        <h2>Your booking is confirmed!</h2>
        <p>Booking ID: ${booking._id}</p>
        <p>Status: ${booking.status}</p>
        <p>QR Code:</p>
        <img src="${qrCodeBase64}" alt="QR Code"/>
      `,
    });

    res.json({ message: "Payment verified, QR code sent", qrCode: qrCodeBase64 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

export default router;