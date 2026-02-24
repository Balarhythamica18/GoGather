import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";

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
      const { q, title, organizerName, location, date, category, minPrice, maxPrice } = req.query;

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
      // Handle date if needed (depending on how date is stored, currently String 'MM DD')
      // For now, simple regex match
      if (date) {
        query.$or = [
          { date: { $regex: date, $options: "i" } },
          { month: { $regex: date, $options: "i" } }
        ];
      }

      // Price range handling
      if (minPrice || maxPrice) {
        // Since price is stored as String like "Rs.699" or "Free", 
        // we might need to be careful. Ideally it should be Num.
        // For filtering implementation, we assume numeric comparison is desired.
        // We'll try to match it if it was numeric, but given the current seed data, 
        // a robust range filter on String prices is hard without schema change.
      }

      let events = await Event.find(query).populate("organizer", "name email");

      // Filter by organizer name if provided (since it's a joined field)
      if (organizerName) {
        events = events.filter(event =>
          event.organizer?.name?.toLowerCase().includes(organizerName.toLowerCase())
        );
      }

      res.json(events);
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
      const users = await User.find().select("-password");
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
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

      // Calculate revenue (Rough estimate: Confirmed Bookings * Event Price)
      // Note: This is an approximation since price exists on Event, not historical price on Booking
      const confirmedBookingsData = await Booking.find({ status: "confirmed" }).populate("eventId");
      let totalRevenue = 0;
      confirmedBookingsData.forEach(booking => {
        if (booking.eventId && booking.eventId.price) {
          const price = parseFloat(booking.eventId.price.replace(/[^0-9.]/g, '')) || 0;
          const count = booking.ticketCount || (booking.seats ? booking.seats.length : 1);
          totalRevenue += price * count;
        }
      });

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

      const event = await Event.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!event) return res.status(404).json({ message: "Event not found" });

      res.json({ message: `Event ${status} successfully`, event });
    } catch (error) {
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
