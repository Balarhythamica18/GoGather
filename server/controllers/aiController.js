import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";
import { containsHarmfulWords } from "../utils/moderation.js";

// Helper to get GoGather Context
const getGoGatherContext = async () => {
    try {
        const dbEvents = await Event.find({ status: "approved", isDeleted: false }).lean();
        const bookings = await Booking.find({ status: "confirmed" }).lean();

        const eventsWithAvailability = dbEvents.map(event => {
            const eventBookings = bookings.filter(b => b.eventId?.toString() === event._id?.toString());
            let totalTaken = 0;
            eventBookings.forEach(b => {
                totalTaken += (b.seats && b.seats.length > 0) ? b.seats.length : (Number(b.ticketCount) || 0);
            });
            const capacity = event.capacity || 60;
            const available = Math.max(0, capacity - totalTaken);
            return { ...event, availableSeats: available, totalCapacity: capacity };
        });

        return eventsWithAvailability.map(e => (
            `EVENT: "${e.title}"
- Category: ${e.category}
- Date: ${e.date} ${e.month}
- Time: ${e.time} (Ends at: ${e.endTime || "N/A"})
- Location: ${e.location} (${e.address || "No specific address"})
- Price: ₹${e.price}
- Availability: ${e.availableSeats}/${e.totalCapacity} seats left
- About: ${e.aboutEvent || e.description || "No description available."}
- Highlights: ${e.keyHighlights?.join(", ") || "N/A"}
- Refund Policy: ${e.refundPolicy || "Standard policy applies."}
- Organizer: ${e.organizerDetails?.name || "GoGather Partner"}`
        )).join("\n\n---\n\n");
    } catch (error) {
        console.error("Context Fetch Error:", error);
        return "NO EVENTS CURRENTLY AVAILABLE.";
    }
};

const SYSTEM_PROMPT = `
You are the GoGather Smart Assistant, a friendly and highly knowledgeable guide for the GoGather event booking platform. Your goal is to provide "360-degree support"—assisting users with everything from finding the perfect event to completing their booking and managing their tickets.

### 1. EVENT DISCOVERY & DETAILS
- Use the [DATABASE] below to answer specific questions about events.
- Always provide clear details: Title, Category, Date/Time, Location, Price, and current Seat Availability.
- If a user asks for recommendations, suggest events based on their interests (e.g., "If you like comedy, we have...") or those with high availability.

### 2. BOOKING ASSISTANCE (STEP-BY-STEP)
If a user asks how to book or seems stuck, guide them:
- **Phase 1: Selection**: Go to the Home or Events page, choose an event, and click "Event Details".
- **Phase 2: Seat/Ticket Choice**: Click "Book Now". For seat-based events (Comedy, Concerts), you can pick your specific seat and "Select Your Vibe" (e.g., Laughter Legend, Front Row Rocker).
- **Phase 3: Checkout**: Click "Proceed to Payment". We support Card, UPI (GPay, PhonePe, Paytm), and Net Banking.
- **Phase 4: Confirmation**: Once paid, your digital ticket with a QR code will be available in "My Bookings".

### 3. ACCOUNT & BOOKINGS
- Users can view their tickets in the "My Bookings" section.
- Tickets include a unique QR code for entry.

### 4. REFUND & CANCELLATION POLICY
- **100% Refund**: Within 2 hours of booking (if event is >24h away).
- **90% Refund**: More than 48 hours before the event starts.
- **50% Refund**: Between 24 to 48 hours before the event.
- **No Refund**: Less than 24 hours before the event.
- **How to Cancel**: Go to "My Bookings", find your ticket, and click "Cancel Ticket".

### 5. SUPPORT & CONTACT
- For technical issues or organizer inquiries, email: gogatherticketbooking@gmail.com

### 6. TONE & PERSONALITY
- Be enthusiastic, professional, and helpful. Use emojis occasionally to keep it friendly.
- If asked about something unrelated to GoGather, say: "I'm here to help with your GoGather adventure! For other topics, I might not be the best expert."
`;

export const unifiedChat = async (req, res) => {
    const { message } = req.body;
    const geminiKey = process.env.GEMINI_KEY?.trim();
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const eventsContext = await getGoGatherContext();

    console.log(`[AI] Request received: "${message}"`);

    // Moderation Check for AI Chatbot
    if (message && containsHarmfulWords(message)) {
        console.warn(`[AI] !!! Moderation blocked harmful input: "${message}"`);
        return res.status(403).json({
            reply: "Don't use harmful, threatening, or immoral words in this chat. Please follow our safety policies.",
            provider: "moderation-blocked"
        });
    }

    // Strategy 1: Attempt Gemini
    if (geminiKey) {
        try {
            console.log("Attempting Gemini AI...");
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: SYSTEM_PROMPT + "\n\n[DATABASE]\n" + eventsContext
            });
            const result = await model.generateContent(message);
            const response = await result.response;
            const text = response.text();

            if (text && text.trim().length > 0) {
                console.log("Gemini succeeded.");
                return res.status(200).json({ reply: text, provider: "gemini" });
            }
            console.warn("Gemini returned empty text, falling back...");
        } catch (error) {
            console.error("Gemini Failure:", error.response?.status || error.message);
            if (error.status === 404) console.warn("Gemini model not found. Check if gemini-1.5-flash is still valid in your region.");
            if (error.status === 403) console.warn("Gemini access forbidden. Check if your API key is correct and has access to this model.");
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

            const text = response.data.choices[0].message.content;
            if (text && text.trim().length > 0) {
                console.log("Groq succeeded.");
                return res.status(200).json({ reply: text, provider: "groq" });
            }
            console.warn("Groq returned empty text.");
        } catch (error) {
            const errorMsg = error.response?.data?.error?.message || error.message;
            console.error("Groq Failure:", errorMsg);
            if (error.response?.status === 404) console.warn("Groq model not found. Consider updating llama-3.3-70b-versatile.");
        }
    }

    //both fail
    console.error("All AI strategies failed. Please check your Render Dashboard -> Environment Variables for the SERVER service.");
    return res.status(200).json({
        reply: "⚠️ I'm having trouble connecting to my brain right now. Please ensure your `GEMINI_KEY` or `GROQ_API_KEY` are correctly set in the **Environment Variables** section of your **Render Server Dashboard**. After adding them, make sure to **redeploy** or wait for the service to restart.",
        provider: "error-fallback"
    });
};
