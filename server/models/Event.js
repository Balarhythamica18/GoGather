import mongoose from "mongoose";

const organizerSchema = new mongoose.Schema({
  name: String,
  description: String,
  contactEmail: String,
  contactPhone: String,
});

const eventSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    month: String,
    date: String,
    time: String,
    title: String,
    description: String,
    image: String,
    location: String,
    address: String,
    category: String,
    price: String,
    declaration: String,
    aboutEvent: String,
    keyHighlights: [String],
    organizerDetails: organizerSchema,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    // 🆕 CANCELLATION TRACKING FIELDS
    cancellationReason: {
      type: String,
      enum: ["cancelled", "postponed", "rescheduled", "admin-action"],
      default: null,
    },
    cancellationMessage: {
      type: String,
      default: "",
    },
    cancellationDate: {
      type: Date,
      default: null,
    },
    refundApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // 🆕 PROFESSIONAL EVENT FIELDS
    mapLink: {
      type: String,
      default: "",
    },
    capacity: {
      type: Number,
      default: 0,
    },
    availableSeats: {
      type: Number,
      default: 0,
    },
    sessions: [
      {
        title: String,
        startTime: String,
        endTime: String,
      },
    ],
    refundPolicy: {
      type: String,
      default: "",
    },
    refundTiers: [
      {
        hoursBefore: Number, // Hours before event
        refundPercentage: Number, // Percentage to refund
      },
    ],
    // 🆕 BROCHURE & INSTRUCTIONS
    brochure: {
      type: String,
      default: "",
    },
    instructions: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
