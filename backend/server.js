const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const buildPrompt = (notes) => `
You are an AI assistant that extracts structured information from meeting notes.

STRICT RULES:
- Do NOT invent names, deadlines, decisions, or action items that are NOT in the text.
- If information is missing, use null or empty array.
- Return ONLY valid JSON. No markdown, no explanation.

Return JSON in this exact shape:
{
  "discussionPoints": ["point 1", "point 2"],
  "decisions": ["decision 1", "decision 2"],
  "actionItems": [
    { "task": "description", "assignee": "name or null", "deadline": "date or null" }
  ],
  "pendingQuestions": ["question 1", "question 2"]
}

Meeting Notes:
"""
${notes}
"""
`;

app.post("/api/extract", async (req, res) => {
    try {
        const { notes } = req.body;

        if (!notes || notes.trim().length < 10) {
            return res.status(400).json({ error: "Please provide meeting notes (min 10 chars)." });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: { responseMimeType: "application/json" },
        });

        const result = await model.generateContent(buildPrompt(notes));
        const raw = result.response.text();

        const cleaned = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        res.json(parsed);
    } catch (err) {
        console.error("Error:", err.message);
        res.status(500).json({ error: "AI extraction failed. Try again." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));