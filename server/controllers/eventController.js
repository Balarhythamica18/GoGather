import Event from "../models/Event.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

export const createEvent = async (req, res) => {
  try {
    const { date, ...otherData } = req.body;

    // Parse the date to extract month and day
    let month = "";
    let dayOnly = "";
    if (date) {
      const dateObj = new Date(date);
      const year = dateObj.getFullYear();
      const monthNum = String(dateObj.getMonth() + 1).padStart(2, "0");
      dayOnly = String(dateObj.getDate()).padStart(2, "0");
      month = `${year}-${monthNum}`;
    }

    const imageUrl = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

    // Attach organizer from authenticated user when available
    const eventData = {
      ...otherData,
      month: month,
      date: dayOnly,
      image: imageUrl,
      organizerDetails: {
        name: req.body.organizerName,
        contactEmail: req.body.organizerEmail,
        contactPhone: req.body.organizerPhone,
      },
      status: "pending", // Explicitly set as pending
    };

    if (req.user && req.user.id) {
      eventData.organizer = req.user.id;

      try {
        const user = await User.findById(req.user.id).select("name email");
        if (user) {
          eventData.organizerDetails.name = user.name || eventData.organizerDetails.name;
          eventData.organizerDetails.contactEmail = user.email || eventData.organizerDetails.contactEmail;
        }
      } catch (e) {
        console.error("Could not fetch user to populate organizerDetails:", e.message);
      }
    }

    // Remove old organizer fields
    delete eventData.organizerName;
    delete eventData.organizerEmail;
    delete eventData.organizerPhone;

    console.log("Creating event with image:", eventData.image);

    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllEvents = async (req, res) => {
  try {
    // Only return approved events for public view
    const events = await Event.find({ status: "approved" }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: "Unauthorized" });

    // Fetch user email to include legacy events that were created before organizer reference was added
    const user = await User.findById(req.user.id).select("email");
    const email = user?.email;

    const query = email
      ? { $or: [{ organizer: req.user.id }, { "organizerDetails.contactEmail": email }] }
      : { organizer: req.user.id };

    const events = await Event.find(query).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUpcomingEvents = async (req, res) => {
  try {
    // Find approved events that have a non-empty declaration field
    const events = await Event.find({ status: "approved", declaration: { $exists: true, $ne: "" } }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Only organizer who created the event or admin can delete
    if (req.user?.role !== "admin" && String(event.organizer) !== String(req.user?.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { date, ...otherData } = req.body;

    // Find existing event
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization: only owner or admin
    if (req.user?.role !== "admin" && String(event.organizer) !== String(req.user?.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Update date/month if provided
    if (date) {
      try {
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const monthNum = String(dateObj.getMonth() + 1).padStart(2, "0");
        event.month = `${year}-${monthNum}`;
        event.date = String(dateObj.getDate()).padStart(2, "0");
      } catch (e) {
        console.error("Invalid date provided to updateEvent:", e.message);
      }
    }

    // Image: if a new file uploaded, use it; else if image field provided, use it; otherwise preserve existing
    if (req.file) {
      event.image = `http://localhost:5000/uploads/${req.file.filename}`;
    } else if (otherData.image) {
      event.image = otherData.image;
    }

    // Update simple fields if provided in body
    const simpleFields = [
      "title",
      "description",
      "location",
      "address",
      "category",
      "price",
      "aboutEvent",
      "declaration",
    ];

    simpleFields.forEach((f) => {
      if (otherData[f] !== undefined) event[f] = otherData[f];
    });

    // keyHighlights may come as array or single string
    if (otherData.keyHighlights !== undefined) {
      if (Array.isArray(otherData.keyHighlights)) event.keyHighlights = otherData.keyHighlights;
      else if (typeof otherData.keyHighlights === "string") event.keyHighlights = [otherData.keyHighlights];
    }

    // Organizer details
    event.organizerDetails = event.organizerDetails || {};
    if (otherData.organizerName) event.organizerDetails.name = otherData.organizerName;
    if (otherData.organizerEmail) event.organizerDetails.contactEmail = otherData.organizerEmail;
    if (otherData.organizerPhone) event.organizerDetails.contactPhone = otherData.organizerPhone;

    // Reset status to pending if an organizer edits the event
    if (req.user?.role !== "admin") {
      event.status = "pending";
    } else if (otherData.status) {
      // Allow admins to update status directly if needed (though usually handled via admin routes)
      event.status = otherData.status;
    }

    await event.save();
    res.json(event);
  } catch (error) {
    console.error("Error updating event:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getMyStats = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: "Unauthorized" });

    // 1. Fetch all events for this organizer
    const user = await User.findById(req.user.id).select("email");
    const email = user?.email;

    const eventQuery = email
      ? { $or: [{ organizer: req.user.id }, { "organizerDetails.contactEmail": email }] }
      : { organizer: req.user.id };

    console.log("Stats Event Query:", JSON.stringify(eventQuery));
    const events = await Event.find(eventQuery);
    const eventIds = events.map(e => e._id);

    // 2. Fetch all bookings for these events
    const bookings = await Booking.find({ eventId: { $in: eventIds }, status: "confirmed" }).populate("eventId");

    // 3. Calculate stats
    let totalRevenue = 0;
    let totalBookingsCount = 0;

    bookings.forEach(booking => {
      totalBookingsCount += (booking.ticketCount || (booking.seats ? booking.seats.length : 1));

      if (booking.eventId && booking.eventId.price) {
        // Price might be "Rs.500" or "500" or "Free"
        const priceStr = String(booking.eventId.price).replace(/[^0-9.]/g, '');
        const price = parseFloat(priceStr) || 0;
        const count = booking.ticketCount || (booking.seats ? booking.seats.length : 1);
        totalRevenue += price * count;
      }
    });

    const stats = {
      totalEvents: events.length,
      approvedEvents: events.filter(e => e.status === "approved").length,
      pendingEvents: events.filter(e => e.status === "pending" || !e.status).length,
      rejectedEvents: events.filter(e => e.status === "rejected").length,
      totalBookings: totalBookingsCount,
      totalRevenue: totalRevenue
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching organizer stats:", error.message);
    res.status(500).json({ message: error.message });
  }
};
