import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import {
  createEvent,
  getEventById,
  getAllEvents,
  getUpcomingEvents,
  updateEvent,
  deleteEvent
} from "../controllers/eventController.js";

const router = express.Router();

router.post("/", upload.single("image"), createEvent);
router.put("/:id", upload.single("image"), updateEvent);

router.get("/", getAllEvents);

// Return only upcoming events (events with a declaration)
router.get("/upcoming", getUpcomingEvents);

router.get("/:id", getEventById);

router.delete("/:id", deleteEvent);

export default router;
