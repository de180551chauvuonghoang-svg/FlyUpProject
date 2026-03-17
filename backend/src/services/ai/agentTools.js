import { tool } from 'ai';
import { z } from 'zod';
import * as courseCache from '../courseCacheService.js';

/**
 * Tool for getting course information
 */
export const getCourseInfo = tool({
  description: 'Get information about available courses from the knowledge base',
  parameters: z.object({
    query: z.string().optional().describe('Filter courses by title or keyword'),
  }),
  execute: async (args) => {
    try {
      console.log(`🔍 Executing getCourseInfo with args:`, JSON.stringify(args));
      const { query } = args || {};
      let context = await courseCache.getCourseContext();
      
      // Truncate for testing if too large
      if (context.length > 5000) {
        console.log(`⚠️ Truncating context from ${context.length} to 5000 chars`);
        context = context.substring(0, 5000) + "... (truncated)";
      }

      console.log(`✅ getCourseInfo executed successfully, context length: ${context.length}`);
      return context;
    } catch (error) {
      console.error(`❌ getCourseInfo tool error:`, error.message);
      throw error;
    }
  },
});

/**
 * Add more tools here as needed
 */

