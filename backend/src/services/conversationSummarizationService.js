import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Conversation Summarization Service
 * Intelligently condenses long conversations while preserving critical context
 */

/**
 * Summarize a sequence of messages
 * @param {Array} messages - Array of message objects to summarize
 * @returns {Promise<string>} Summary text
 */
export const summarizeMessages = async (messages) => {
  try {
    if (!messages || messages.length === 0) {
      return "No previous conversation.";
    }

    // Build conversation text from messages
    const conversationText = messages.map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    }).join('\n\n');

    const summarizationPrompt = `
You are a conversation summarizer. Analyze the following conversation and create a concise summary that preserves:
1. Key topics discussed
2. Course IDs mentioned (if any)
3. User preferences or interests
4. Important questions or decisions

Conversation:
${conversationText}

Provide a structured summary in this format:
"User discussed: [topics]. Interested in: [courses/subjects]. Key questions: [questions if any]."

Keep it under 500 tokens and preserve specific course IDs.

Summary:`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: summarizationPrompt
        }
      ],
      model: "openai/gpt-oss-20b",
      temperature: 0.3, // Lower temperature for more consistent summaries
      max_tokens: 500
    });

    const summary = completion.choices[0]?.message?.content || "Unable to summarize conversation.";

    console.log(`📝 Generated summary (${summary.length} chars) from ${messages.length} messages`);

    return summary;

  } catch (error) {
    console.error('❌ Summarization error:', error.message);
    // Fallback to simple concatenation on error
    return `Previous conversation covered ${messages.length} messages.`;
  }
};

/**
 * Check if conversation needs summarization
 * @param {Array} messages - Current conversation history
 * @returns {boolean} True if summarization needed
 */
export const needsSummarization = (messages) => {
  const MESSAGE_THRESHOLD = 10;
  return messages && messages.length > MESSAGE_THRESHOLD;
};

/**
 * Extract important entities from messages (course IDs, etc.)
 * @param {Array} messages - Messages to analyze
 * @returns {Object} Extracted entities
 */
export const extractEntities = (messages) => {
  const entities = {
    courseIds: new Set(),
    prices: new Set(),
    topics: new Set()
  };

  messages.forEach(msg => {
    // Extract course IDs (assuming format like "Course ID: 123" or similar)
    const courseIdMatches = msg.content.match(/course\s+id[:\s]+([0-9]+)/gi);
    if (courseIdMatches) {
      courseIdMatches.forEach(match => {
        const id = match.match(/\d+/)?.[0];
        if (id) entities.courseIds.add(id);
      });
    }

    // Extract VND prices
    const priceMatches = msg.content.match(/(\d+[,.]?\d*)\s*(VND|₫|đồng)/gi);
    if (priceMatches) {
      priceMatches.forEach(price => entities.prices.add(price));
    }
  });

  return {
    courseIds: Array.from(entities.courseIds),
    prices: Array.from(entities.prices),
    topics: Array.from(entities.topics)
  };
};
