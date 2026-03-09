import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import {
  createEvent,
  getEventById,
  getAllEvents,
  getUpcomingEvents,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getMyStats,
  debugEvents,
} from "../controllers/eventController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create & update & delete require authentication
router.post("/", authMiddleware, upload.single("image"), createEvent);
router.put("/:id", authMiddleware, upload.single("image"), updateEvent);
router.delete("/:id", authMiddleware, deleteEvent);

// Return all events (public)
router.get("/", getAllEvents);

// Return only upcoming events (events with a declaration)
router.get("/upcoming", getUpcomingEvents);

// Return events for logged-in organizer
router.get("/my", authMiddleware, getMyEvents);

// Return stats for logged-in organizer
router.get("/stats", authMiddleware, getMyStats);
router.get("/debug", debugEvents);
router.get("/:id", getEventById);

export default router;
