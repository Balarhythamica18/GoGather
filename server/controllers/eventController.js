import Event from "../models/Event.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { sendEventPendingNotification, sendEventStatusUpdateNotification } from "../services/notificationService.js";
import { handleEventCancellation, notifyOrganizerOfCancellation } from "../services/eventCancellationService.js";
import cloudinary from "../configs/cloudinary.js";
import fs from "fs";

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


    let imageUrl = req.body.image || null;
    let brochureUrl = req.body.brochure || null;

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        try {
          const result = await cloudinary.uploader.upload(req.files.image[0].path, {
            folder: "gogather/events",
          });
          imageUrl = result.secure_url;
          if (fs.existsSync(req.files.image[0].path)) {
            fs.unlinkSync(req.files.image[0].path);
          }
        } catch (uploadError) {
          console.error("Cloudinary Image Upload Error:", uploadError);
        }
      }

      if (req.files.brochure && req.files.brochure[0]) {
        try {
          const result = await cloudinary.uploader.upload(req.files.brochure[0].path, {
            folder: "gogather/brochures",
            resource_type: "auto" // Important for PDFs
          });
          brochureUrl = result.secure_url;
          if (fs.existsSync(req.files.brochure[0].path)) {
            fs.unlinkSync(req.files.brochure[0].path);
          }
        } catch (uploadError) {
          console.error("Cloudinary Brochure Upload Error:", uploadError);
        }
      }
    }

    // Attach organizer from authenticated user when available
    const eventData = {
      ...otherData,
      month: month,
      date: dayOnly,
      image: imageUrl,
      brochure: brochureUrl,
      instructions: req.body.instructions || "",
      organizerDetails: {
        name: req.body.organizerName,
        contactEmail: req.body.organizerEmail,
        contactPhone: req.body.organizerPhone,
      },
      mapLink: req.body.mapLink || "",
      endTime: req.body.endTime || "",
      capacity: parseInt(req.body.capacity) || 0,
      availableSeats: parseInt(req.body.capacity) || 0,
    };

    // Parse sessions if provided
    if (req.body.sessions) {
      try {
        eventData.sessions = typeof req.body.sessions === "string"
          ? JSON.parse(req.body.sessions)
          : req.body.sessions;
      } catch (err) {
        console.error("Error parsing sessions:", err);
      }
    }

    // Parse refundTiers if provided
    if (req.body.refundTiers) {
      try {
        eventData.refundTiers = typeof req.body.refundTiers === "string"
          ? JSON.parse(req.body.refundTiers)
          : req.body.refundTiers;
      } catch (err) {
        console.error("Error parsing refundTiers:", err);
      }
    }

    if (req.user && req.user.id) {
      eventData.organizer = req.user.id;

      try {
        const user = await User.findById(req.user.id).select("name email isApprovedByAdmin");
        if (user) {
          eventData.organizerDetails.name = user.name || eventData.organizerDetails.name;
          eventData.organizerDetails.contactEmail = user.email || eventData.organizerDetails.contactEmail;

          // Auto-approve events if organizer is verified by admin
          if (user.isApprovedByAdmin) {
            eventData.status = "approved";
          } else {
            eventData.status = "pending";
          }
        }
      } catch (e) {
        console.error("Could not fetch user to populate organizerDetails:", e.message);
        eventData.status = "pending";
      }
    } else {
      eventData.status = "pending";
    }

    // Remove old organizer fields
    delete eventData.organizerName;
    delete eventData.organizerEmail;
    delete eventData.organizerPhone;

    console.log("Creating event with image:", eventData.image);

    // Verify date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: "Cannot create events for past dates." });
    }

    const event = await Event.create(eventData);
    console.log(`Event created: ${event._id} (${event.title})`);

    // Notify Admin via Socket only if event is pending
    const io = req.app.get("socketio");
    if (io && event.status === "pending") {
      const pendingCount = await Event.countDocuments({ status: "pending" });
      io.emit("pendingCountUpdate", { count: pendingCount });
    }

    // Send appropriate notifications based on event status
    if (event.status === "approved") {
      // Event was auto-published because organizer is verified
      const organizerEmail = event.organizerDetails?.contactEmail;
      if (organizerEmail) {
        console.log(`[EVENT] Notifying organizer (${organizerEmail}) that event "${event.title}" was auto-published`);
        try {
          await sendEventStatusUpdateNotification(organizerEmail, event.title, "approved");
        } catch (emailErr) {
          console.error("[EVENT] Organizer auto-publish notification failure:", emailErr.message);
        }
      }
    } else {
      // Event is pending, notify admin
      const adminEmail = process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com";
      console.log(`[EVENT] Notifying admin (${adminEmail}) about new event: ${event.title}`);
      try {
        await sendEventPendingNotification(
          adminEmail,
          { name: event.organizerDetails.name, email: event.organizerDetails.contactEmail },
          { title: event.title, location: event.location, date: event.date, month: event.month }
        );
      } catch (emailErr) {
        console.error("[EVENT] Admin email notification failure:", emailErr.message);
      }
    }

    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Failed to create event. " + error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[EVENT DEBUG] Fetching event with ID: ${id}`);

    // Run cleanup to ensure we don't return an expired event
    await cleanupExpiredEvents();

    const event = await Event.findById(id);
    if (!event) {
      console.warn(`[EVENT DEBUG] Event NOT FOUND in DB for ID: ${id}`);
      return res.status(404).json({
        message: "Event not found",
        debugId: id,
        timestamp: new Date().toISOString()
      });
    }
    res.json(event);
  } catch (error) {
    console.error(`[EVENT DEBUG] Error fetching event by ID (${req.params.id}):`, error.message);
    res.status(500).json({ message: error.message });
  }
};

export const cleanupExpiredEvents = async () => {
  try {
    // Use IST offset (+5.5 hours) to ensure consistent date/time comparison for India-based events
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const today = new Date(now.getTime() + istOffset);

    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, "0");
    const day = String(today.getUTCDate()).padStart(2, "0");
    const currentMonthString = `${year}-${month}`;
    const currentTimeString = today.getUTCHours().toString().padStart(2, "0") + ":" +
      today.getUTCMinutes().toString().padStart(2, "0");

    // 1. Find expired events
    const expiredEvents = await Event.find({
      status: { $ne: "completed" }, // Only process non-completed events
      $or: [
        { month: { $lt: currentMonthString } },
        { month: currentMonthString, date: { $lt: day } },
        { month: currentMonthString, date: day, endTime: { $ne: "", $lt: currentTimeString } }
      ]
    });

    if (expiredEvents.length > 0) {
      const expiredIds = expiredEvents.map(e => e._id);

      // 2. Instead of deleting, mark events as completed
      await Event.updateMany(
        { _id: { $in: expiredIds } },
        { $set: { status: "completed" } }
      );

      console.log(`[CLEANUP] Automatically marked ${expiredEvents.length} expired events as COMPLETED. ✅`);
    } else {
      console.log(`[CLEANUP] No expired events found to remove. ✅`);
    }
  } catch (error) {
    console.error("[CLEANUP] Error during automatic event removal:", error.message);
  }
};

export const getAllEvents = async (req, res) => {
  try {
    // Run cleanup before fetching
    await cleanupExpiredEvents();

    // Debug log to help track Render issues
    const totalCount = await Event.countDocuments({});
    console.log(`[EVENT FETCH] Total events in DB: ${totalCount}`);

    // Relaxed filter: show both approved and pending events in production for now
    // Only return approved/pending events for public view (exclude specifically rejected)
    const events = await Event.find({
      status: { $in: ["approved", "completed"] },
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    console.log(`[EVENT FETCH] Returning ${events.length} public events`);
    res.json(events);
  } catch (error) {
    console.error(`[EVENT FETCH ERROR] ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const getMyEvents = async (req, res) => {
  try {
    // Run cleanup
    await cleanupExpiredEvents();

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
    // Run cleanup
    await cleanupExpiredEvents();

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

    // Authorization: only owner or admin can delete
    let isAuthorized = req.user?.role === "admin";

    if (!isAuthorized) {
      console.log(`[AUTH DEBUG] Deleting event. req.user:`, req.user);
      console.log(`[AUTH DEBUG] Event organizer ID:`, event.organizer);

      // 1. Check by organizer ID
      if (event.organizer && String(event.organizer) === String(req.user?.id)) {
        isAuthorized = true;
      }

      // 2. Fallback: Check by email if ID check failed (or if organizer ID is missing)
      if (!isAuthorized && event.organizerDetails?.contactEmail) {
        const user = await User.findById(req.user?.id);
        const userEmail = user?.email?.toLowerCase()?.trim();
        const eventEmail = event.organizerDetails.contactEmail?.toLowerCase()?.trim();

        console.log(`[AUTH DEBUG] User email:`, userEmail, `Event contactEmail:`, eventEmail);

        if (userEmail && eventEmail && userEmail === eventEmail) {
          isAuthorized = true;
          console.log(`[AUTH DEBUG] Authorized via email fallback`);
        }
      }
    }

    if (!isAuthorized) {
      console.log(`[AUTH DEBUG] Authorization FAILED for delete`);
      return res.status(403).json({ message: "Forbidden: You are not authorized to delete this event" });
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      eventId: req.params.id,
      status: { $in: ["confirmed", "pending"] }
    });

    if (activeBookings > 0) {
      console.log(`[EVENT DELETION] Event ${event.title} has ${activeBookings} active bookings. Processing cancellation...`);

      // Get organizer email
      const organizer = await User.findById(event.organizer);
      const organizerEmail = organizer?.email;

      // Process event cancellation and send emails to all affected users
      const cancellationResult = await handleEventCancellation(
        event._id,
        "cancelled",
        "",
        req.user?.id
      );

      console.log(`[EVENT DELETION] Cancellation result:`, cancellationResult);

      // Soft delete: Mark as deleted but keep record for audit trail
      event.isDeleted = true;
      event.cancellationReason = "cancelled";
      event.cancellationDate = new Date();
      event.refundApprovedBy = req.user?.id;
      await event.save();

      // Notify organizer of actions taken
      if (organizerEmail) {
        await notifyOrganizerOfCancellation(
          organizerEmail,
          organizer?.name || "Organizer",
          event.title,
          activeBookings,
          cancellationResult
        );
      }

      return res.json({
        message: `Event deleted successfully. ${cancellationResult.emailsSent} cancellation notifications sent to affected users.`,
        cancellationDetails: cancellationResult,
        isDeleted: true
      });
    } else {
      // No bookings, safe to delete
      await Event.findByIdAndDelete(req.params.id);
      res.json({ message: "Event deleted" });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Delete operation failed. " + error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { date, ...otherData } = req.body;

    // Find existing event
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization: only owner or admin
    let isAuthorized = req.user?.role === "admin";

    if (!isAuthorized) {
      console.log(`[AUTH DEBUG] Updating event. req.user:`, req.user);
      console.log(`[AUTH DEBUG] Event organizer ID:`, event.organizer);

      // 1. Check by organizer ID
      if (event.organizer && String(event.organizer) === String(req.user?.id)) {
        isAuthorized = true;
      }

      // 2. Fallback: Check by email if ID check failed (or if organizer ID is missing)
      if (!isAuthorized && event.organizerDetails?.contactEmail) {
        const user = await User.findById(req.user?.id);
        const userEmail = user?.email?.toLowerCase()?.trim();
        const eventEmail = event.organizerDetails.contactEmail?.toLowerCase()?.trim();

        console.log(`[AUTH DEBUG] User email:`, userEmail, `Event contactEmail:`, eventEmail);

        if (userEmail && eventEmail && userEmail === eventEmail) {
          isAuthorized = true;
          console.log(`[AUTH DEBUG] Authorized via email fallback`);
        }
      }
    }

    if (!isAuthorized) {
      console.log(`[AUTH DEBUG] Authorization FAILED for update`);
      return res.status(403).json({ message: "Forbidden: You are not authorized to edit this event" });
    }

    // Update date/month if provided
    if (date) {
      try {
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
          const year = dateObj.getFullYear();
          const monthNum = String(dateObj.getMonth() + 1).padStart(2, "0");
          event.month = `${year}-${monthNum}`;
          event.date = String(dateObj.getDate()).padStart(2, "0");
        }
      } catch (e) {
        console.error("Invalid date provided to updateEvent:", e.message);
      }
    }

    // Image & Brochure: if a new file uploaded, use it; else if field provided, use it; otherwise preserve existing
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        try {
          const result = await cloudinary.uploader.upload(req.files.image[0].path, {
            folder: "gogather/events",
          });
          event.image = result.secure_url;
          if (fs.existsSync(req.files.image[0].path)) {
            fs.unlinkSync(req.files.image[0].path);
          }
        } catch (uploadError) {
          console.error("Cloudinary Update Image Error:", uploadError);
        }
      }

      if (req.files.brochure && req.files.brochure[0]) {
        try {
          const result = await cloudinary.uploader.upload(req.files.brochure[0].path, {
            folder: "gogather/brochures",
            resource_type: "auto"
          });
          event.brochure = result.secure_url;
          if (fs.existsSync(req.files.brochure[0].path)) {
            fs.unlinkSync(req.files.brochure[0].path);
          }
        } catch (uploadError) {
          console.error("Cloudinary Update Brochure Error:", uploadError);
        }
      }
    } else {
      if (otherData.image) event.image = otherData.image;
      if (otherData.brochure) event.brochure = otherData.brochure;
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
      "mapLink",
      "capacity",
      "time",
      "endTime",
      "refundPolicy",
      "instructions",
    ];

    simpleFields.forEach((f) => {
      if (otherData[f] !== undefined) event[f] = otherData[f];
    });

    // Update refundTiers
    if (otherData.refundTiers !== undefined) {
      try {
        event.refundTiers = typeof otherData.refundTiers === "string"
          ? JSON.parse(otherData.refundTiers)
          : otherData.refundTiers;
      } catch (err) {
        console.error("Error parsing refundTiers in update:", err);
      }
    }

    // keyHighlights may come as array or single string
    if (otherData.keyHighlights !== undefined) {
      if (Array.isArray(otherData.keyHighlights)) event.keyHighlights = otherData.keyHighlights;
      else if (typeof otherData.keyHighlights === "string") event.keyHighlights = [otherData.keyHighlights];
    }

    // Update capacity and availableSeats logic
    if (otherData.capacity !== undefined) {
      const newCapacity = parseInt(otherData.capacity) || 0;

      // Calculate actual sold seats from confirmed bookings to ensure accuracy
      const confirmedBookings = await Booking.find({
        eventId: req.params.id,
        status: "confirmed"
      });

      const soldSeats = confirmedBookings.reduce((sum, b) =>
        sum + (b.seats?.length || b.ticketCount || 1), 0);

      event.capacity = newCapacity;
      event.availableSeats = Math.max(0, newCapacity - soldSeats);
      console.log(`[CAPACITY UPDATE] Event ${event._id}: Capacity set to ${newCapacity}, Available seats calculated as ${event.availableSeats} (Sold: ${soldSeats})`);
    }

    // Update sessions
    if (otherData.sessions !== undefined) {
      try {
        event.sessions = typeof otherData.sessions === "string"
          ? JSON.parse(otherData.sessions)
          : otherData.sessions;
      } catch (err) {
        console.error("Error parsing sessions in update:", err);
      }
    }

    // Organizer details
    event.organizerDetails = event.organizerDetails || {};
    if (otherData.organizerName) event.organizerDetails.name = otherData.organizerName;
    if (otherData.organizerEmail) event.organizerDetails.contactEmail = otherData.organizerEmail;
    if (otherData.organizerPhone) event.organizerDetails.contactPhone = otherData.organizerPhone;

    // Reset status to pending if an organizer edits the event (unless it was already approved)
    if (req.user?.role !== "admin") {
      if (event.status !== "approved") {
        event.status = "pending";

        // Notify Admin about the edit/re-submission
        const adminEmail = process.env.ADMIN_EMAIL || "gogatherticketbooking@gmail.com";
        try {
          await sendEventPendingNotification(
            adminEmail,
            { name: event.organizerDetails.name, email: event.organizerDetails.contactEmail },
            { title: `${event.title} (Updated/Re-submitted)`, location: event.location, date: event.date, month: event.month }
          );
        } catch (emailErr) {
          console.error("Non-blocking email notification failure in updateEvent:", emailErr.message);
        }
      }
    } else if (otherData.status) {
      // Allow admins to update status directly if needed (though usually handled via admin routes)
      event.status = otherData.status;
    }

    await event.save();
    res.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Update failed: " + error.message });
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

    // 3. Calculate stats accurately using historical booking data
    let totalRevenue = 0;
    let totalBookingsCount = 0;

    bookings.forEach(booking => {
      totalBookingsCount += (booking.ticketCount || booking.seats?.length || 1);
      totalRevenue += booking.amount || 0;
    });
    totalRevenue = Math.round(totalRevenue * 100) / 100;

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

export const debugEvents = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments({});
    const approvedEvents = await Event.countDocuments({ status: "approved" });
    const pendingEvents = await Event.countDocuments({ status: "pending" });
    const deletedEvents = await Event.countDocuments({ isDeleted: true });

    // Masked URI for safety
    const rawUri = process.env.MONGODB_URI || "";
    let mongodbHost = "Unknown";
    let dbName = "Unknown";

    if (rawUri.includes("@")) {
      mongodbHost = rawUri.split('@')[1]?.split('/')[0] || "Unknown";
      const rest = rawUri.split('@')[1] || "";
      dbName = rest.split('/')[1]?.split('?')[0] || "Default (test)";
    } else if (rawUri.startsWith("mongodb://")) {
      mongodbHost = rawUri.split("://")[1]?.split("/")[0] || "localhost";
      dbName = rawUri.split("://")[1]?.split("/")[1]?.split("?")[0] || "Default (test)";
    }

    const eventsSummary = await Event.find({}, 'title status month date declaration').limit(10).lean();

    res.json({
      dbStatus: "OK",
      totalEvents,
      stats: {
        approved: approvedEvents,
        pending: pendingEvents,
        deleted: deletedEvents
      },
      events: eventsSummary.map(e => ({
        title: e.title,
        status: e.status,
        raw_month: e.month,
        raw_date: e.date,
        parsed_date_test: new Date(`${e.month}-${String(e.date).padStart(2, "0")}T00:00:00`).toString(),
        hasDeclaration: !!e.declaration
      })),
      mongodb: {
        host: mongodbHost,
        database: dbName,
        uri_prefix: rawUri.substring(0, 15) + "..."
      },
      server: {
        time: new Date().toISOString(),
        node_env: process.env.NODE_ENV || "development",
        port: process.env.PORT || "5000"
      },
      clientConfig: {
        render_url: "https://gogather-server.onrender.com"
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
