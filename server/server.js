import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./configs/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Connect DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  // Allow Google OAuth popups
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});



// Test route
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// Auth route
app.use("/api/auth", authRoutes);

// Event Route
app.use("/api/events", eventRoutes);

// Booking routes
app.use("/api/bookings", bookingRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);
console.log("Admin routes registered at /api/admin");

// Serve uploads folder
app.use("/uploads", express.static(uploadsDir));

// AI Routes
app.use("/api/ai", aiRoutes);

/* ==============================
   CONTACT ROUTE
============================== */
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gogatherticketbooking@gmail.com",
        pass: process.env.EMAIL_PASS,
      },
    });

    // 1️⃣ Email to Team
    await transporter.sendMail({
      from: `"GoGather Contact" <gogatherticketbooking@gmail.com>`,
      to: "gogatherticketbooking@gmail.com",
      subject: `New Contact Query: ${subject}`,
      html: `
        <h2>New Customer Inquiry 🎟️</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not Provided"}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    // 2️⃣ Confirmation Email to User
    await transporter.sendMail({
      from: `"GoGather Ticket Booking" <gogatherticketbooking@gmail.com>`,
      to: email,
      subject: "We Received Your Query - GoGather 🎫",
      html: `
        <h2>Hello ${name},</h2>
        <p>Thank you for contacting <strong>GoGather Ticket Booking</strong>.</p>
        <p>We have received your query regarding "<strong>${subject}</strong>".</p>
        <p>Our support team will reach you soon.</p>
        <br/>
        <p>🎫 <strong>Happy Ticketing!</strong></p>
        <p>GoGather Support Team</p>
      `,
    });

    res.status(200).json({ message: "Emails sent successfully ✅" });
  } catch (error) {
    console.error("Contact Error:", error);
    res.status(500).json({ error: "Failed to send email ❌" });
  }
});
/* ==============================
   END CONTACT ROUTE
============================== */

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: { origin: "*" }, // replace * with your frontend origin for production
});

// Socket.IO seat locking/unlocking
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Lock a seat
  socket.on("lockSeat", ({ eventId, seat }) => {
    socket.broadcast.emit("seatLocked", { eventId, seat });
  });

  // Unlock a seat
  socket.on("unlockSeat", ({ eventId, seat }) => {
    socket.broadcast.emit("seatUnlocked", { eventId, seat });
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    // If you have a way to track which user was on this socket
    // For now, an improved way is to identify user on connection
  });

  // Identify user to track online status
  socket.on("identify", async (userId) => {
    socket.userId = userId;
    await (await import("./models/User.js")).default.findByIdAndUpdate(userId, { isOnline: true });
  });

  socket.on("disconnect", async () => {
    if (socket.userId) {
      await (await import("./models/User.js")).default.findByIdAndUpdate(socket.userId, { isOnline: false });
    }
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);