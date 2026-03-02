import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import http from "http";
import { Server } from "socket.io";
import dns from "dns";
import { sendEmail } from "./utils/emailUtility.js";

// Force IPv4 for all network connections (fixes ENETUNREACH on Render/Gmail)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

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
  // Allow Google OAuth popups and relax COOP for cross-origin compatibility
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
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
  const adminEmail = process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com";

  console.log(`[CONTACT] Received message from ${name} (${email}) - Subject: ${subject}`);

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1️⃣ Email to Team (Blocking)
    await sendEmail({
      from: `"${name}" <${adminEmail}>`, // Show user name, but must keep adminEmail for Gmail SMTP auth
      replyTo: email,
      to: adminEmail,
      subject: `New Contact Query: ${subject}`,
      html: `
        <h2>New Customer Inquiry 🎟️</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not Provided"}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    }, true);

    // 2️⃣ Confirmation Email to User (Blocking)
    await sendEmail({
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
      `
    }, true);

    // Return success only after both emails are sent
    res.status(200).json({ message: "Message sent successfully ✅" });
  } catch (error) {
    console.error(`[CONTACT ERROR] Failed to process contact request:`, error.message);
    res.status(500).json({
      error: "Failed to send email. Please check your connection or try again later.",
      details: error.message
    });
  }
});
/* ==============================
   END CONTACT ROUTE
============================== */

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: { origin: "https://gogather-client.onrender.com" },
  transports: ['polling', 'websocket']
});
app.set("socketio", io);

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

  // Squad Chat Events
  socket.on("join-squad", ({ code, user }) => {
    socket.join(code);
    console.log(`[SQUAD] User ${user.name} joined squad: ${code}`);
    // Notify others in the squad
    socket.to(code).emit("squad-notification", {
      type: "user-joined",
      message: `${user.name} joined the squad!`,
      timestamp: new Date()
    });
  });

  socket.on("send-squad-message", ({ code, message, user, id }) => {
    console.log(`[SQUAD] Msg from ${user.name} to room ${code}: ${message}`);
    const messageData = {
      id: id || (Date.now() + Math.random().toString(36).substr(2, 9)),
      text: message,
      sender: user,
      timestamp: new Date()
    };
    // Send to everyone in the room including sender
    io.to(code).emit("receive-squad-message", messageData);
  });

  socket.on("leave-squad", ({ code, user }) => {
    socket.leave(code);
    socket.to(code).emit("squad-notification", {
      type: "user-left",
      message: `${user.name} left the squad.`,
      timestamp: new Date()
    });
  });

  // Identify user to track online status
  socket.on("identify", async (userId) => {
    socket.userId = userId;
    try {
      const User = (await import("./models/User.js")).default;
      await User.findByIdAndUpdate(userId, { isOnline: true });
      console.log(`User ${userId} is now online`);
    } catch (err) {
      console.error("Error updating online status:", err);
    }
  });

  socket.on("disconnect", async () => {
    if (socket.userId) {
      try {
        const User = (await import("./models/User.js")).default;
        await User.findByIdAndUpdate(socket.userId, { isOnline: false });
      } catch (err) {
        console.error("Error updating offline status:", err);
      }
    }
    console.log("Client disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
