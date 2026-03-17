import * as conversationMemory from '../../services/conversationMemoryService.js';
import * as courseCache from '../../services/courseCacheService.js';
import { streamText } from 'ai';
import { AgentFactory } from '../../services/ai/agentFactory.js';

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
 * Injects course context directly into system prompt for reliable streaming.
 * Note: Tool-based approach was removed because Groq's llama model
 * does not support multi-step tool calling via @ai-sdk/groq.
 */
export const chatStream = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (sessionId && !isValidUUID(sessionId)) {
      return res.status(400).json({ error: "Invalid sessionId format. Must be a valid UUID" });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    sendEvent(res, { type: 'start', sessionId: sessionId || null });

    // Fetch conversation history
    let conversationHistory = [];
    if (sessionId) {
      conversationHistory = await conversationMemory.getHistory(sessionId);
      console.log(`📚 Retrieved ${conversationHistory.length} messages from history`);
    }

    // Fetch course context and inject directly into system prompt
    const courseContext = await courseCache.getCourseContext();
    console.log(`📚 Loaded course context: ${courseContext.length} chars`);

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

    console.log(`🤖 Streaming with Vercel AI SDK (direct context injection)`);

    let fullResponse = '';
    let chunkIndex = 0;

    try {
      const result = streamText({
        model: AgentFactory.getModel('groq', 'llama-3.3-70b-versatile'),
        system: systemPrompt,
        messages: [
          ...conversationHistory.map(m => ({
            role: m.role,
            content: m.content
          })),
          { role: 'user', content: message }
        ],
      });

      for await (const chunk of result.fullStream) {
        if (chunk.type === 'text-delta') {
          const content = chunk.text;
          fullResponse += content;

          sendEvent(res, {
            type: 'chunk',
            text: content,
            index: chunkIndex++
          });
        } else if (chunk.type === 'error') {
          console.error(`❌ Stream Chunk Error:`, chunk.error);
        }
      }

      sendEvent(res, {
        type: 'complete',
        fullText: fullResponse
      });

      console.log(`✅ Streaming complete: ${fullResponse.length} chars`);

      // Save conversation if sessionId is provided
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

    res.end();

  } catch (error) {
    console.error("❌ Chatbot Streaming Error:", error);

    try {
      sendEvent(res, {
        type: 'error',
        message: 'Server error occurred'
      });
      res.end();
    } catch (e) {
      console.error('Failed to send error event:', e.message);
    }
  }
};









