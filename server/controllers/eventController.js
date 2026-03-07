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

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "gogather/events",
        });
        imageUrl = result.secure_url;
        // Delete local file after upload
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);
        return res.status(500).json({ message: "Failed to upload image to cloud." });
      }
    }

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
    };

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
    // Run cleanup to ensure we don't return an expired event
    await cleanupExpiredEvents();

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cleanupExpiredEvents = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const currentMonthString = `${year}-${month}`;

    // 1. Find expired events
    const expiredEvents = await Event.find({
      $or: [
        { month: { $lt: currentMonthString } },
        { month: currentMonthString, date: { $lt: day } }
      ]
    });

    if (expiredEvents.length > 0) {
      const expiredIds = expiredEvents.map(e => e._id);

      // 2. Delete Bookings associated with these events
      await Booking.deleteMany({ eventId: { $in: expiredIds } });

      // 3. Delete the Events themselves
      await Event.deleteMany({ _id: { $in: expiredIds } });

      console.log(`[CLEANUP] Automatically removed ${expiredEvents.length} expired events and their bookings. ✅`);
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

    // Only return approved events for public view
    const events = await Event.find({ status: "approved" }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
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
    const event = await Event.findById(req.params.id).populate("organizer");
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Only organizer who created the event or admin can delete
    if (req.user?.role !== "admin" && String(event.organizer._id) !== String(req.user?.id)) {
      return res.status(403).json({ message: "Forbidden" });
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
    if (req.user?.role !== "admin" && String(event.organizer) !== String(req.user?.id)) {
      return res.status(403).json({ message: "Forbidden" });
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

    // Image: if a new file uploaded, use it; else if image field provided, use it; otherwise preserve existing
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "gogather/events",
        });
        event.image = result.secure_url;
        // Delete local file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadError) {
        console.error("Cloudinary Update Upload Error:", uploadError);
        return res.status(500).json({ message: "Failed to update image on cloud." });
      }
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
