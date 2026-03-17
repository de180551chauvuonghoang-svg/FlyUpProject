import redis from '../lib/cache.js';
import * as summarization from './conversationSummarizationService.js';

const CHAT_KEY_PREFIX = 'chat:';
const SUMMARY_KEY_PREFIX = 'chat:summary:';
const MAX_MESSAGES = 10;
const SESSION_TTL = 3600; // 1 hour
const SUMMARIZATION_THRESHOLD = 10;

/**
 * Conversation Memory Service
 * Manages chat history in Redis with session-based storage and auto-summarization
 */

/**
 * Get conversation history for a session with auto-summarization
 * @param {string} sessionId - Unique session identifier
 * @returns {Promise<Array>} Array of message objects
 */
export const getHistory = async (sessionId) => {
  try {
    const key = `${CHAT_KEY_PREFIX}${sessionId}`;
    const summaryKey = `${SUMMARY_KEY_PREFIX}${sessionId}`;

    // Fetch all messages from Redis list
    const messages = await redis.lrange(key, 0, -1);

    if (!messages || messages.length === 0) {
      console.log(`📝 Cache miss: No history for session ${sessionId}`);
      return [];
    }

    // Parse JSON strings back to objects
    const parsedMessages = messages.map(msg => {
      try {
        return JSON.parse(msg);
      } catch (error) {
        console.error('Failed to parse message:', error);
        return null;
      }
    }).filter(Boolean);

    console.log(`✅ Cache hit: Retrieved ${parsedMessages.length} messages for session ${sessionId}`);

    // Check if summarization is needed
    if (parsedMessages.length > SUMMARIZATION_THRESHOLD) {
      console.log(`🔄 Conversation exceeds ${SUMMARIZATION_THRESHOLD} messages, checking for summary...`);

      // Check if we already have a cached summary
      let cachedSummary = await redis.get(summaryKey);

      if (!cachedSummary) {
        // Summarize oldest 6 messages
        const oldestMessages = parsedMessages.slice(0, 6);
        const summaryText = await summarization.summarizeMessages(oldestMessages);

        // Create summary message
        const summaryMessage = {
          role: "system",
          content: `Previous conversation summary: ${summaryText}`,
          timestamp: Date.now(),
          isSummary: true
        };

        // Cache the summary
        await redis.setex(summaryKey, SESSION_TTL, JSON.stringify(summaryMessage));
        cachedSummary = JSON.stringify(summaryMessage);

        console.log(`💾 Created and cached summary for session ${sessionId}`);
      } else {
        console.log(`✅ Using cached summary for session ${sessionId}`);
      }

      // Return: [summary] + last 6 messages (instead of 12+)
      const recentMessages = parsedMessages.slice(-6);
      const summaryObj = JSON.parse(cachedSummary);

      return [summaryObj, ...recentMessages];
    }

    // Return last MAX_MESSAGES if no summarization needed
    return parsedMessages.slice(-MAX_MESSAGES);

  } catch (error) {
    console.error('❌ Redis getHistory error:', error.message);
    // Fallback to empty history on Redis failure
    return [];
  }
};

/**
 * Save a message to conversation history
 * @param {string} sessionId - Unique session identifier
 * @param {Object} message - Message object with role and content
 */
export const saveMessage = async (sessionId, message) => {
  try {
    const key = `${CHAT_KEY_PREFIX}${sessionId}`;

    // Add timestamp to message
    const messageWithTimestamp = {
      ...message,
      timestamp: Date.now()
    };

    // Append message to Redis list (FIFO)
    await redis.rpush(key, JSON.stringify(messageWithTimestamp));

    // Set TTL to auto-expire after 1 hour
    await redis.expire(key, SESSION_TTL);

    console.log(`💾 Saved message for session ${sessionId}`);

  } catch (error) {
    console.error('❌ Redis saveMessage error:', error.message);
    // Silent fail - don't crash the app if Redis is down
  }
};

/**
 * Clear conversation history for a session
 * @param {string} sessionId - Unique session identifier
 */
export const clearHistory = async (sessionId) => {
  try {
    const key = `${CHAT_KEY_PREFIX}${sessionId}`;
    const summaryKey = `${SUMMARY_KEY_PREFIX}${sessionId}`;

    // Delete both conversation and summary
    await Promise.all([
      redis.del(key),
      redis.del(summaryKey)
    ]);

    console.log(`🗑️ Cleared history and summary for session ${sessionId}`);
  } catch (error) {
    console.error('❌ Redis clearHistory error:', error.message);
  }
};

/**
 * Get session info (message count, TTL)
 * @param {string} sessionId - Unique session identifier
 * @returns {Promise<Object>} Session metadata
 */
export const getSessionInfo = async (sessionId) => {
  try {
    const key = `${CHAT_KEY_PREFIX}${sessionId}`;
    const [count, ttl] = await Promise.all([
      redis.llen(key),
      redis.ttl(key)
    ]);

    return {
      messageCount: count,
      ttl: ttl,
      expiresIn: ttl > 0 ? `${Math.floor(ttl / 60)} minutes` : 'N/A'
    };
  } catch (error) {
    console.error('❌ Redis getSessionInfo error:', error.message);
    return { messageCount: 0, ttl: -1, expiresIn: 'N/A' };
  }
};


