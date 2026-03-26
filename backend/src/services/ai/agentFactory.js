import { getGroqProvider } from '../../utils/ai-providers/groqClient.js';

/**
 * Agent Factory for creating specialized AI agents
 */
export const AgentFactory = {
  /**
   * Get a model instance based on provider and model name
   * @param {string} provider - Provider name (default: 'groq')
   * @param {string} modelName - Model name
   * @returns {Object} AI model instance
   */
  getModel(provider = 'groq', modelName) {
    switch (provider.toLowerCase()) {
      case 'groq':
        const groq = getGroqProvider();
        return groq(modelName || 'llama-3.3-70b-versatile');
      
      // Future providers can be added here
      // case 'openai':
      //   return openai(modelName || 'gpt-4o');
        
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
};
