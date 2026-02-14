import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";

dotenv.config();

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

//EventRoute
app.use("/api/events", eventRoutes);


app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
