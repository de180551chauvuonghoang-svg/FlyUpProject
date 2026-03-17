import Groq from 'groq-sdk';
import { createGroq } from '@ai-sdk/groq';

// Initialize Groq client (legacy SDK singleton)
let groqClient = null;

// Initialize Vercel AI SDK Groq provider
let groqProvider = null;

/**
 * Get or create Groq provider instance (Vercel AI SDK)
 * @returns {Object} Groq provider
 */
export function getGroqProvider() {
  if (!groqProvider) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    groqProvider = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groqProvider;
}

/**
 * Get or create Groq client instance (Legacy SDK)
 * @returns {Groq} Groq SDK client
 */
export function getGroqClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }

    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 10000, // 10 second timeout
    });

    console.log('✅ Groq legacy client initialized');
  }

  return groqClient;
}

/**
 * Generate AI completion with error handling and timeout
 * @param {Object} params - Completion parameters
 * @param {Array} params.messages - Chat messages array
 * @param {string} params.model - Model ID (default: llama-3.3-70b-versatile)
 * @param {number} params.temperature - Sampling temperature (0-2)
 * @param {number} params.max_tokens - Max tokens to generate
 * @param {number} params.timeout - Request timeout in ms
 * @returns {Promise<string>} AI generated text
 */
export async function generateCompletion({
  messages,
  model = 'llama-3.1-70b-versatile',
  temperature = 0.7,
  max_tokens = 1024,
  timeout = 8000
}) {
  let timeoutId; // Track timeout ID for cleanup

  try {
    const client = getGroqClient();

    // Create timeout promise with tracked ID
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Groq request timeout')), timeout);
    });

    // Race between API call and timeout
    const completionPromise = client.chat.completions.create({
      messages,
      model,
      temperature,
      max_tokens,
    });

    const completion = await Promise.race([completionPromise, timeoutPromise]);

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      throw new Error('Empty response from Groq API');
    }

    return text;

  } catch (error) {
    console.error('[Groq Client] Error:', error.message);

    // Categorize errors for better handling
    if (error.message.includes('timeout')) {
      throw new Error('AI_TIMEOUT');
    } else if (error.status === 429) {
      throw new Error('AI_RATE_LIMIT');
    } else if (error.status >= 500) {
      throw new Error('AI_SERVICE_ERROR');
    } else {
      throw new Error(`AI_ERROR: ${error.message}`);
    }
  } finally {
    // Always clear timeout to prevent memory leak
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Health check for Groq service
 * @returns {Promise<boolean>} True if service is healthy
 */
export async function checkGroqHealth() {
  try {
    await generateCompletion({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5,
      timeout: 3000
    });
    return true;
  } catch (error) {
    console.error('[Groq Health Check] Failed:', error.message);
    return false;
  }
}
