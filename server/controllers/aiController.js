import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";

// Helper to get GoGather Context
const getGoGatherContext = async () => {
    try {
        const dbEvents = await Event.find({ status: "approved" }).lean();
        const bookings = await Booking.find({ status: "confirmed" }).lean();

        const eventsWithAvailability = dbEvents.map(event => {
            const eventBookings = bookings.filter(b => b.eventId?.toString() === event._id?.toString());
            let totalTaken = 0;
            eventBookings.forEach(b => {
                totalTaken += (b.seats && b.seats.length > 0) ? b.seats.length : (Number(b.ticketCount) || 0);
            });
            const isSeatBased = event.category?.toLowerCase() !== "art" && event.category?.toLowerCase() !== "sport";
            const capacity = isSeatBased ? 60 : 100;
            const available = Math.max(0, capacity - totalTaken);
            return { ...event, availableSeats: available, totalCapacity: capacity };
        });

        return eventsWithAvailability.map(e => (
            `- ${e.title} at ${e.location}. Price: ${e.price}. Date: ${e.date}. Availability: ${e.availableSeats}/${e.totalCapacity}.`
        )).join("\n");
    } catch (error) {
        console.error("Context Fetch Error:", error);
        return "NO EVENTS CURRENTLY AVAILABLE.";
    }
};

const SYSTEM_PROMPT = `
You are the Specialized GoGather Assistant. 
Only answer about GoGather events provided in the context.
If asked about anything else, say: "I only have information about GoGather events."
If matching events aren't found, say: "I couldn't find any matching events on GoGather."
When listing events, include Title, Date, Location, Price, and Availability.
`;

export const unifiedChat = async (req, res) => {
    const { message } = req.body;
    const geminiKey = process.env.GEMINI_KEY?.trim();
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const eventsContext = await getGoGatherContext();

    // Strategy 1: Attempt Gemini
    if (geminiKey) {
        try {
            console.log("Attempting Gemini AI...");
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash-latest", // Use latest for better availability
                systemInstruction: SYSTEM_PROMPT + "\n\n[DATABASE]\n" + eventsContext
            });
            const result = await model.generateContent(message);
            const response = await result.response;
            return res.status(200).json({ reply: response.text(), provider: "gemini" });
        } catch (error) {
            console.error("Gemini Failure:", error.message);
            // If it's a 404/403, and we have Groq, fall through
            if (!groqKey) {
                return res.status(500).json({
                    error: "AI Error",
                    reply: "⚠️ Gemini API Error (" + (error.status || "404") + "). To fix this instantly, please add a `GROQ_API_KEY` to your `.env` for fallback support."
                });
            }
        }
    }

    // Strategy 2: Fallback to Groq
    if (groqKey) {
        try {
            console.log("Attempting Groq AI Fallback...");
            const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT + "\n\n[DATABASE]\n" + eventsContext },
                    { role: "user", content: message }
                ]
            }, {
                headers: { Authorization: `Bearer ${groqKey}` }
            });
            return res.status(200).json({ reply: response.data.choices[0].message.content, provider: "groq" });
        } catch (error) {
            console.error("Groq Failure:", error.response?.data || error.message);
            return res.status(500).json({
                error: "AI Error",
                reply: "⚠️ All AI providers failed. Please add a valid GROQ_API_KEY to .env for fallback."
            });
        }
    }

    return res.status(500).json({
        error: "Configuration Error",
        reply: "⚠️ AI is not configured. Please provide a valid GEMINI_KEY or GROQ_API_KEY."
    });
};
