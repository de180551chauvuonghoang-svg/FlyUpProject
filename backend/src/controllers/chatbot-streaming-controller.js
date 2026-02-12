import Groq from "groq-sdk";
import * as conversationMemory from '../services/conversation-memory-service.js';
import * as courseCache from '../services/course-cache-service.js';

// UUID validation helper
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * SSE Event Emitter Helper
 */
const sendEvent = (res, event) => {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
};

/**
 * Streaming Chat Controller
 * Handles SSE-based streaming responses for real-time chatbot interaction
 */
export const chatStream = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Validate message
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Validate sessionId if provided
    if (sessionId && !isValidUUID(sessionId)) {
      return res.status(400).json({ error: "Invalid sessionId format. Must be a valid UUID" });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send start event
    sendEvent(res, { type: 'start', sessionId: sessionId || null });

    // Initialize Groq SDK
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is missing");
      sendEvent(res, { type: 'error', message: 'Server configuration error' });
      res.end();
      return;
    }

    // Fetch conversation history if sessionId is provided
    let conversationHistory = [];
    if (sessionId) {
      conversationHistory = await conversationMemory.getHistory(sessionId);
      console.log(`📚 Retrieved ${conversationHistory.length} messages from history`);
    }

    // Fetch course data from cache (or DB if cache miss)
    const courseContext = await courseCache.getCourseContext();

    // Build system prompt
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
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    console.log(`🤖 Streaming ${messages.length} messages to Groq API`);

    // Stream response from Groq
    let fullResponse = '';
    let chunkIndex = 0;

    try {
      const stream = await groq.chat.completions.create({
        messages: messages,
        model: "openai/gpt-oss-20b",
        temperature: 0.5,
        max_tokens: 1024,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;

        if (content) {
          fullResponse += content;

          // Send chunk event
          sendEvent(res, {
            type: 'chunk',
            text: content,
            index: chunkIndex++
          });
        }
      }

      // Send complete event
      sendEvent(res, {
        type: 'complete',
        fullText: fullResponse
      });

      console.log(`✅ Streaming complete: ${fullResponse.length} chars`);

      // Save conversation to Redis if sessionId is provided
      if (sessionId) {
        await conversationMemory.saveMessage(sessionId, {
          role: "user",
          content: message
        });

        await conversationMemory.saveMessage(sessionId, {
          role: "assistant",
          content: fullResponse
        });

        console.log(`💾 Saved streaming conversation for session ${sessionId}`);
      }

    } catch (streamError) {
      console.error('❌ Streaming error:', streamError);
      sendEvent(res, {
        type: 'error',
        message: 'Failed to generate response'
      });
    }

    // Close the SSE connection
    res.end();

  } catch (error) {
    console.error("❌ Chatbot Streaming Error:", error);

    // Try to send error event if connection is still open
    try {
      sendEvent(res, {
        type: 'error',
        message: 'Server error occurred'
      });
      res.end();
    } catch (e) {
      // Connection already closed
      console.error('Failed to send error event:', e.message);
    }
  }
};
