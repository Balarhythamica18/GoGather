import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import { sendEventStatusUpdateNotification } from "../services/notificationService.js";

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  authorizeRoles("admin"),
  (req, res) => {
    res.json({ message: "Welcome Admin 👑" });
  }
);

// Test Route
router.get("/hello", (req, res) => res.json({ message: "Hello from Admin" }));

// Get all events with filtering
router.get(
  "/events",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { q, title, organizerName, location, date, category, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      let query = {};

      if (q) {
        query.$or = [
          { title: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } },
          { location: { $regex: q, $options: "i" } }
        ];
      }

      if (title) query.title = { $regex: title, $options: "i" };
      if (location) query.location = { $regex: location, $options: "i" };
      if (category) query.category = category;

      if (date) {
        query.$or = [
          { date: { $regex: date, $options: "i" } },
          { month: { $regex: date, $options: "i" } }
        ];
      }

      const total = await Event.countDocuments(query);
      let events = await Event.find(query)
        .populate("organizer", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      if (organizerName) {
        events = events.filter(event =>
          event.organizer?.name?.toLowerCase().includes(organizerName.toLowerCase())
        );
      }

      res.json({
        events,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalEntries: total
      });
    } catch (error) {
      console.error("Fetch Events Error:", error);
      res.status(500).json({ message: "Error fetching events", error: error.message });
    }
  }
);

// Get all users
router.get(
  "/users",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { q, role, location, date, page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      let query = {};

      if (q) {
        query.name = { $regex: q, $options: "i" };
      }

      if (role && role !== "all") {
        query.role = role;
      }

      if (location) {
        query.location = { $regex: location, $options: "i" };
      }

      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.createdAt = {
          $gte: startDate,
          $lt: endDate
        };
      }

      console.log("Fetch Users Params:", { q, role, location, date, page, limit });
      console.log("Calculated Query:", JSON.stringify(query, null, 2));

      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      res.json({
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalEntries: total
      });
    } catch (error) {
      console.error("Fetch Users Error:", error);
      res.status(500).json({ message: "Error fetching users", error: error.message });
    }
  }
);



// Get Statistics
router.get(
  "/stats",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const organizersCount = await User.countDocuments({ role: "organizer" });
      const adminsCount = await User.countDocuments({ role: "admin" });
      const customersCount = await User.countDocuments({ role: "user" });

      const totalEvents = await Event.countDocuments();
      const totalBookings = await Booking.countDocuments();
      const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });

      const onlineTotal = await User.countDocuments({ isOnline: true });
      const onlineOrganizers = await User.countDocuments({ isOnline: true, role: "organizer" });
      const onlineUsers = await User.countDocuments({ isOnline: true, role: "user" });

      // Calculate revenue accurately using the 'amount' field in confirmed bookings
      const confirmedBookingsData = await Booking.find({ status: "confirmed" });
      let totalRevenue = 0;
      let totalBookingsCount = 0;
      confirmedBookingsData.forEach(booking => {
        totalBookingsCount += (booking.ticketCount || booking.seats?.length || 1);
        totalRevenue += booking.amount || 0;
      });
      totalRevenue = Math.round(totalRevenue * 100) / 100;

      res.json({
        users: {
          total: totalUsers,
          organizers: organizersCount,
          admins: adminsCount,
          customers: customersCount,
          online: {
            total: onlineTotal,
            organizers: onlineOrganizers,
            customers: onlineUsers
          }
        },
        events: totalEvents,
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings
        },
        revenue: totalRevenue
      });
    } catch (error) {
      console.error("Stats Error:", error);
      res.status(500).json({ message: "Error fetching statistics" });
    }
  }
);

// Get user info with context (events/bookings)
router.get(
  "/users/:id/info",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });

      let data = { user };
      if (user.role === "organizer") {
        data.events = await Event.find({ organizer: user._id }).select("title");
      } else {
        data.bookings = await Booking.find({ userId: user._id }).populate("eventId", "title");
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user details" });
    }
  }
);

// Delete user
router.delete(
  "/users/:id",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      // If organizer, delete their events first to prevent orphans
      if (user.role === "organizer") {
        await Event.deleteMany({ organizer: user._id });
      }

      // Delete user's bookings
      await Booking.deleteMany({ userId: user._id });

      // Finally delete the user
      await User.findByIdAndDelete(req.params.id);

      res.json({ message: "User and all associated data deleted successfully" });
    } catch (error) {
      console.error("Delete User Error:", error);
      res.status(500).json({ message: "Error deleting user", error: error.message });
    }
  }
);

// Get count of pending events
router.get(
  "/events/pending-count",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const count = await Event.countDocuments({ status: "pending" });
      res.json({ count });
    } catch (error) {
      console.error("Error fetching pending count:", error);
      res.status(500).json({ message: "Error fetching pending count" });
    }
  }
);

// Get all pending events for review
router.get(
  "/events/pending",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const events = await Event.find({ status: "pending" }).populate("organizer", "name email");
      res.json(events);
    } catch (error) {
      console.error("Error fetching pending events:", error);
      res.status(500).json({ message: "Error fetching pending events", error: error.message });
    }
  }
);

// Update event status (Approve/Reject)
router.patch(
  "/events/:id/status",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const event = await Event.findById(req.params.id).populate("organizer", "email name");
      if (!event) return res.status(404).json({ message: "Event not found" });

      event.status = status;
      await event.save();

      // Emit socket update for pending count
      const io = req.app.get("socketio");
      if (io) {
        const pendingCount = await Event.countDocuments({ status: "pending" });
        io.emit("pendingCountUpdate", { count: pendingCount });
      }

      // Notify Organizer
      const organizerEmail = event.organizer?.email || event.organizerDetails?.contactEmail;
      if (organizerEmail) {
        await sendEventStatusUpdateNotification(organizerEmail, event.title, status);
      }

      res.json({ message: `Event ${status} successfully`, event });
    } catch (error) {
      console.error("Error updating event status:", error);
      res.status(500).json({ message: "Error updating event status" });
    }
  }
);

// Get all bookings
router.get(
  "/bookings/all",
  authMiddleware,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const bookings = await Booking.find()
        .populate("eventId", "title location price date month")
        .populate("userId", "name email")
        .sort({ createdAt: -1 });
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      res.status(500).json({ message: "Error fetching bookings" });
    }
  }
);

export default router;
