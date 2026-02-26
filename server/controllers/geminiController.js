import { GoogleGenerativeAI } from "@google/generative-ai";
import Event from "../models/Event.js";
import Booking from "../models/Booking.js";

export const chatWithAI = async (req, res) => {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_KEY?.trim();

    if (!apiKey) {
        console.error("DEBUG: GEMINI_KEY is MISSING in environment!");
        return res.status(500).json({
            error: "Configuration Error",
            reply: "⚠️ AI configuration error. Please contact support.",
        });
    }

    try {
        // 1. Fetch GoGather Events
        const dbEvents = await Event.find({ status: "approved" }).lean();

        // 2. Fetch Bookings to calculate availability
        const bookings = await Booking.find({ status: "confirmed" }).lean();

        const eventsWithAvailability = dbEvents.map(event => {
            const eventBookings = bookings.filter(b => b.eventId?.toString() === event._id?.toString());

            // Calculate total seats taken
            let totalTaken = 0;
            eventBookings.forEach(b => {
                if (b.seats && b.seats.length > 0) {
                    totalTaken += b.seats.length;
                } else {
                    totalTaken += (Number(b.ticketCount) || 0);
                }
            });

            // Standard capacity logic
            const isSeatBased = event.category?.toLowerCase() !== "art" && event.category?.toLowerCase() !== "sport";
            const capacity = isSeatBased ? 60 : 100;
            const available = Math.max(0, capacity - totalTaken);

            return {
                ...event,
                availableSeats: available,
                totalCapacity: capacity,
                isSeatBased
            };
        });

        const eventsContext = eventsWithAvailability.map(e => (
            `- ${e.title} at ${e.location} (${e.category}). 
              Price: ${e.price}. 
              Date: ${e.date}. 
              Time: ${e.time}.
              Address: ${e.address}.
              Highlights: ${Array.isArray(e.keyHighlights) ? e.keyHighlights.join(", ") : "N/A"}.
              Availability: ${e.availableSeats} seats available out of ${e.totalCapacity}.
              Description: ${e.description}
              About: ${e.aboutEvent}`
        )).join("\n\n");

        const genAI = new GoogleGenerativeAI(apiKey);

        const systemInstruction = `
[ROLE] You are the specialized GoGather Assistant. You are NOT a general AI.
[DATABASE]
${eventsContext || "NO EVENTS CURRENTLY IN GOGATHER DATABASE."}

[STRICT INSTRUCTIONS] 
1. Only answer about GoGather events in the DATABASE above.
2. Provide COMPREHENSIVE details (360-degree): Title, Date, Time, Location, Address, Price, Category, Highlights, and SEAT AVAILABILITY.
3. If a user asks about contacting the team, support, or having issues, YOU MUST RESPOND with: "You can contact our team by visiting the [Contact Us](/contact) page and filling out the form there."
4. If USER QUERY is about anything else (e.g. general cities, geography, general knowledge, other platforms), YOU MUST REFUSE and say: "I only have information about GoGather events."
5. If asked for events in a city and NONE are in the DATABASE, say: "I couldn't find any events in that location on GoGather right now."

[FORMATTING RULES]
- When listing events, use this EXACT structure:
  ### **[Event Title]**
  - **Date & Time**: [Date] at [Time]
  - **Location**: [Location] ([Address])
  - **Price**: [Price]
  - **Availability**: [AvailableSeats] seats left (Total: [TotalCapacity])
  - **Category**: [Category]
  - **Highlights**: [KeyHighlights]
  - **Description**: [Description]
- Separate multiple events with a horizontal divider (---).
- Use proper Markdown. Keep responses professional and helpful.
`;

        console.log("AI CONTEXT LENGTH:", eventsContext.length);
        console.log("AI SYSTEM INSTRUCTION SET");

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest", // Using 'gemini-flash-latest' as it has active quota in 2026
            systemInstruction: systemInstruction,
            generationConfig: {
                temperature: 0.1,
            }
        });

        // Retry logic for 429
        let result;
        try {
            result = await model.generateContent(message);
        } catch (initialError) {
            const isQuota = initialError.status === 429 || initialError.message?.includes("429");
            if (isQuota) {
                console.log("AI Quota hit. Retrying in 5 seconds...");
                await new Promise(resolve => setTimeout(resolve, 5000));
                result = await model.generateContent(message);
            } else {
                throw initialError;
            }
        }

        const response = await result.response;
        let text = response.text();

        console.log("AI RAW REPLY:", text.substring(0, 50));

        // Hard Filter for common hallucinations
        const bannedKeywords = ["paris", "france", "capital of", "bookmyshow", "insider", "ticketnew"];
        if (bannedKeywords.some(k => text.toLowerCase().includes(k))) {
            text = "I'm sorry, I only have access to GoGather's current event listings. I couldn't find any matching events on our platform at this time.";
        }

        res.status(200).json({ reply: text });
    } catch (error) {
        console.error("AI Service Error:", error);

        const isQuotaError = error.status === 429 || error.message?.includes("429") || error.message?.includes("quota");
        const isFetchError = error.message?.includes("fetch failed") || error.message?.includes("UND_ERR_CONNECT_TIMEOUT");

        let replyMessage = "⚠️ AI Assistant is temporarily unavailable. Try again later.";

        if (isQuotaError) {
            replyMessage = "⚠️ AI quota reached. Please try again in a minute.";
        } else if (isFetchError) {
            replyMessage = "⚠️ AI connection failed. Please check your internet or try again.";
        }

        res.status(error.status || 500).json({
            error: "AI Service Error",
            reply: replyMessage,
            details: error.message
        });
    }
};
