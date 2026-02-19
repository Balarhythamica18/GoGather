import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import nodemailer from "nodemailer"; 
import connectDB from "./configs/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";



dotenv.config();

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

// Test route
app.get("/", (req, res) => {
  res.send("Server running ✅");
});

// Auth route
app.use("/api/auth", authRoutes);

// Event Route
app.use("/api/events", eventRoutes);

app.use("/uploads", express.static(uploadsDir));


/*
   CONTACT route */


app.post("/api/contact", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gogatherticketbooking@gmail.com",
        pass: process.env.EMAIL_PASS, //gamil app pwd pass here
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

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
