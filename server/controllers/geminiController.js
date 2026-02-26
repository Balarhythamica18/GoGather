import { GoogleGenerativeAI } from "@google/generative-ai";
import Event from "../models/Event.js";

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
        const dbEvents = await Event.find({ status: "approved" }).select("title description location category price date").lean();

        const eventsContext = dbEvents.map(e => (
            `- ${e.title} at ${e.location} (${e.category}). Price: ${e.price}. Date: ${e.date}. Description: ${e.description}`
        )).join("\n");

        const genAI = new GoogleGenerativeAI(apiKey);

        const systemInstruction = `
[ROLE] You are the specialized GoGather Assistant. You NOT a general AI.
[DATABASE]
${eventsContext || "NO EVENTS CURRENTLY IN GOGATHER DATABASE."}

[STRICT INSTRUCTION] 
1. Only answer about GoGather events in the DATABASE above.
2. If USER QUERY is about anything else (e.g. general cities, geography, general knowledge, other websites like BookMyShow, Paytm Insider), YOU MUST REFUSE and say: "I only have information about GoGather events."
3. DO NOT BE HELPFUL with outside knowledge.
4. If asked for events in a city (like Chennai) and NONE are in the DATABASE, say: "I couldn't find any events in Chennai on GoGather right now."
5. Never mention external platforms.

[FORMATTING RULES]
- When listing events, use this EXACT structure for each event:
  ### **[Event Title]**
  - **Date**: [Date]
  - **Location**: [Location]
  - **Price**: [Price]
  - **Category**: [Category]
  - **Description**: [Description]
- Separate multiple events with a horizontal divider (---).
- Use proper Markdown for bolding and lists.
- Do NOT use sentences like "On 27-02-2026, you can attend...". Just list the events in the structure above.
`;

        console.log("AI CONTEXT LENGTH:", eventsContext.length);
        console.log("AI SYSTEM INSTRUCTION SET");

        const model = genAI.getGenerativeModel({
            model: "models/gemini-2.5-flash-lite", // Switched to 2.5-flash-lite for potentially better quota stability
            systemInstruction: systemInstruction,
            generationConfig: {
                temperature: 0.0,
            }
        });

        // Retry logic for 429
        let result;
        try {
            result = await model.generateContent(message);
        } catch (initialError) {
            const isQuota = initialError.status === 429 || initialError.message?.includes("429");
            if (isQuota) {
                console.log("AI Quota hit. Full error details:", JSON.stringify(initialError, null, 2));
                console.log("Retrying in 5 seconds...");
                await new Promise(resolve => setTimeout(resolve, 5000));
                result = await model.generateContent(message);
            } else {
                throw initialError;
            }
        }

        const response = await result.response;
        let text = response.text();

        console.log("AI RAW REPLY:", text.substring(0, 50));

        // Hard Filter for common hallucinations and external platform leaks
        const bannedKeywords = ["paris", "france", "capital of", "bookmyshow", "insider", "ticketnew", "general knowledge"];
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
