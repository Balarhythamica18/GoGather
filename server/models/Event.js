import mongoose from "mongoose";

const organizerSchema = new mongoose.Schema({
  name: String,
  description: String,
  contactEmail: String,
  contactPhone: String,
});

const eventSchema = new mongoose.Schema(
  {
    month: String,
    date: String,
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
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
