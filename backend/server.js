import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json({ limit: "100kb" }));

// Connect to OpenAI using the backend API key
const openai = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    })
  : null;

// Backend health check
app.get("/api/health", (req, res) => {
  res.json({ status: "TripSync Backend is Running!" });
});

// AI Travel Assistant API
app.post("/api/ai/chat", async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({
        error: "OpenAI API key is not configured."
      });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Please provide chat messages."
      });
    }

    if (messages.length > 20) {
      return res.status(400).json({
        error: "Maximum 20 messages are allowed per request."
      });
    }

    const validMessages = messages.every(
      (message) =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim().length > 0 &&
        message.content.length <= 12000
    );
    


if (!validMessages) {
  console.log(
    "Invalid messages:",
    messages.filter(
      (message) =>
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" ||
        message.content.trim().length === 0 ||
        message.content.length > 4000
    )
  );
}

    if (!validMessages) {
      return res.status(400).json({
        error: "Invalid message format."
      });
    }
    const response = await openai.responses.create({
      model: "openai/gpt-oss-20b",

      
instructions: `
You are TripSync AI, a professional and intelligent personal travel planner.

Your job is to create complete, practical and personalized travel plans based on the user's requirements.

COMMUNICATION STYLE:
- Use simple, natural and friendly English.
- Do not use emojis or decorative symbols.
- Do not use Markdown tables.
- Avoid unnecessary introductions and repeated conclusions.
- Use clear headings and short paragraphs.
- Use bullet points only when they improve readability.
- Never produce unfinished sentences or incomplete sections.

UNDERSTAND THE USER:
Consider the destination, starting location, travel dates, number of days, number of travellers, total budget, interests and transport preferences.
Use information already provided in the conversation.
Do not repeatedly ask for information the user has already shared.
Ask one relevant question only when essential information is missing.

TRAVEL ITINERARY:
When asked to plan a trip:
1. Start with a short trip overview.
2. Divide the itinerary into separate days.
3. Divide each day into morning, afternoon and evening.
4. Give suggested visiting times for each attraction.
5. Group nearby attractions together to reduce travel time.
6. Include realistic travel time between locations.
7. Suggest suitable transport between locations.
8. Include breakfast, lunch, dinner and rest breaks.
9. Explain briefly why each destination is worth visiting.
10. Avoid overcrowding the itinerary.

BUDGET MANAGEMENT:
- Respect the user's total budget.
- Mention that the budget is for the entire group or per person, as appropriate.
- Estimate transport, food, accommodation, entry tickets and other expenses separately.
- Show a day-wise estimated expense breakdown.
- Include the total estimated trip cost.
- Calculate the approximate cost per person.
- Keep some money aside for unexpected expenses.
- Never exceed the user's budget without clearly explaining why.

ACCURACY:
- Never invent confirmed ticket prices, opening hours or transport schedules.
- Clearly label unverified prices and timings as estimates.
- Do not claim that an attraction is free unless you are confident.
- Mention when current information needs verification.
- Prefer geographically practical routes.

CONVERSATION:
- Remember the user's earlier requirements in the conversation.
- If the user changes the budget, destination or dates, update the existing plan.
- Answer follow-up questions in the context of the existing trip.
- Do not repeat the entire itinerary unless requested.

RESPONSE COMPLETENESS:
- Provide a complete answer to the user's request.
- Finish every section and sentence.
- Do not stop halfway through an itinerary.
- Prioritize useful details over unnecessary descriptions.
- If a request is too broad, ask a focused clarification instead of guessing.

Your goal is to behave like a knowledgeable human travel planner and create useful, realistic and complete travel plans.
`,


      input: messages.map((message) => ({
        role: message.role,
        content: message.content.trim()
      })),

      max_output_tokens: 4000
    });

    res.json({
      reply: response.output_text
    });

  } catch (error) {
  console.error("AI Assistant Error:", error);

  res.status(500).json({
    error: error.message || "Unable to generate an AI response."
  });
}
});
// Serve React frontend
app.use(express.static(frontendPath));

// Handle React routes
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
