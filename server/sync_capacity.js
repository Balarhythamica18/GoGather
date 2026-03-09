import mongoose from "mongoose";
import dotenv from "dotenv";
import Event from "./models/Event.js";
import Booking from "./models/Booking.js";

dotenv.config();

const syncCapacity = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error("MONGODB_URI not found in .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("Connected to MongoDB ✅");

    const events = await Event.find({});
    console.log(`Checking ${events.length} events...`);

    for (const event of events) {
      const confirmedBookings = await Booking.find({ 
        eventId: event._id, 
        status: "confirmed" 
      });

      const soldCount = confirmedBookings.reduce((sum, b) => 
        sum + (b.seats?.length || b.ticketCount || 1), 0);
      
      const newAvailable = Math.max(0, (event.capacity || 0) - soldCount);
      
      if (event.availableSeats !== newAvailable) {
        console.log(`Updating Event "${event.title}" (${event._id}):`);
        console.log(`  Capacity: ${event.capacity}`);
        console.log(`  Current Available: ${event.availableSeats}`);
        console.log(`  Actual Sold: ${soldCount}`);
        console.log(`  New Available: ${newAvailable}`);
        
        event.availableSeats = newAvailable;
        await event.save();
        console.log(`  Updated! ✅`);
      }
    }

    console.log("Sync complete! 🚀");
    process.exit(0);
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
};

syncCapacity();
