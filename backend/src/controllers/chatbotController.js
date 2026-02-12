import Groq from "groq-sdk";
import * as conversationMemory from '../services/conversation-memory-service.js';
import * as courseCache from '../services/course-cache-service.js';

// UUID validation helper
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const chat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Validate sessionId if provided
    if (sessionId && !isValidUUID(sessionId)) {
      return res.status(400).json({ error: "Invalid sessionId format. Must be a valid UUID" });
    }

    // Fetch conversation history if sessionId is provided
    let conversationHistory = [];
    if (sessionId) {
      conversationHistory = await conversationMemory.getHistory(sessionId);
      console.log(`📚 Retrieved ${conversationHistory.length} messages from history`);
    }

    // Initialize Groq SDK
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });

    if (!process.env.GROQ_API_KEY) {
        console.error("GROQ_API_KEY is missing. Make sure it is set in .env");
        return res.status(500).json({ error: "Server configuration error: GROQ_API_KEY missing" });
    }


    // 1. Fetch course data from cache (or DB if cache miss)
    const courseContext = await courseCache.getCourseContext();

    // 2. Construct the prompt
    // Use openai/gpt-oss-20b on Groq (Latest supported model)
    const model = "openai/gpt-oss-20b";

    const systemPrompt = `
    You are "FlyUp", a professional and concise Academic Counselor.

    ### KNOWLEDGE BASE (Courses):
    ${courseContext}

    ### INSTRUCTIONS:
    1.  **Direct Answer**: match the user's intent immediately.
    2.  **Course Cards**: When recommending courses, use this clean format:
        *   **[Course Title]**
        *   💰 Price: [Price in VND]
        *   👨‍🏫 Instructor: [Name]
        *   ✨ Why this fits: [1 short sentence linking to user needs]
    3.  **Language**: Reply in the same language as the user (Vietnamese if they speak Vietnamese).
    4.  **Tone**: Helpful, short, and to the point. No fluff.
    5.  **Data**: Use the provided VND price exactly.
    `;

    // Build messages array with conversation history
    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      // Add conversation history if available
      ...conversationHistory,
      // Add current user message
      {
        role: "user",
        content: message
      }
    ];

    console.log(`🤖 Sending ${messages.length} messages to Groq API`);

    // 3. Generate response using Groq
    const completion = await groq.chat.completions.create({
        messages: messages,
        model: model,
        temperature: 0.5,
        max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // Save conversation to Redis if sessionId is provided
    if (sessionId) {
      // Save user message
      await conversationMemory.saveMessage(sessionId, {
        role: "user",
        content: message
      });

      // Save assistant response
      await conversationMemory.saveMessage(sessionId, {
        role: "assistant",
        content: text
      });

      console.log(`💾 Saved conversation for session ${sessionId}`);
    }

    return res.status(200).json({ response: text, sessionId });

  } catch (error) {
    console.error("Chatbot Error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
};
