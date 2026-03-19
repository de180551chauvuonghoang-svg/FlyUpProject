import { streamText } from 'ai';
import { AgentFactory } from '../../services/ai/agentFactory.js';
import * as tools from '../../services/ai/agentTools.js';

// UUID pattern matcher
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Extract UUIDs from messages to help the model populate tool arguments.
 * Injects detected UUIDs into the system prompt as explicit context.
 */
function buildSystemPrompt(messages, customPrompt) {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userContent = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';
  const detectedIds = userContent.match(UUID_PATTERN) || [];

  const idHint = detectedIds.length > 0
    ? `\n\nDETECTED IDs in the user's message: ${detectedIds.map(id => `"${id}"`).join(', ')}. Use the FIRST ID as the "id" argument when calling getLectureDetail or getArticleDetail.`
    : '';

  return customPrompt || `You are FlyUp AI Assistant for the FlyUp online learning platform.

Your job:
- When asked about a lecture, call getLectureDetail with the "id" argument set to the lecture's UUID.
- When asked about an article, call getArticleDetail with the "id" argument set to the UUID.
- For course info, call getCourseInfo.
- After getting results, summarize in Vietnamese.
${idHint}`;
}

/**
 * Chat with a specialized AI agent (streaming)
 * POST /api/ai/agent/chat
 */
export async function chatWithAgent(req, res) {
  try {
    const { messages, modelName, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: "messages" array is required.'
      });
    }

    const model = AgentFactory.getModel('groq', modelName);
    const system = buildSystemPrompt(messages, systemPrompt);

    console.log(`🤖 System prompt:\n${system}`);

    const result = await streamText({
      model,
      messages,
      system,
      tools: {
        getCourseInfo: tools.getCourseInfo,
        getLectureDetail: tools.getLectureDetail,
        getArticleDetail: tools.getArticleDetail,
      },
      maxSteps: 5,
      onStepFinish: (event) => {
        console.log(`🤖 AI Step Finished. Reason: ${event.finishReason}`);
        if (event.toolCalls && event.toolCalls.length > 0) {
          console.log(`🛠️ Tools called:`, JSON.stringify(event.toolCalls));
        }
      },
    });

    // Stream UI messages to the Express response
    result.pipeUIMessageStreamToResponse(res);

  } catch (error) {
    console.error(`AI Agent Controller Error:`, error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error occurred during AI agent interaction.'
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}
