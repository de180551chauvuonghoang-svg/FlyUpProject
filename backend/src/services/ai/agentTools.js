import { tool, jsonSchema } from 'ai';
import * as courseCache from '../courseCacheService.js';
import prisma from '../../lib/prisma.js';

/**
 * Tool for getting course information
 */
export const getCourseInfo = tool({
  description: 'Get information about available courses from the knowledge base',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Filter courses by title or keyword' }
    }
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
      return `Error retrieving courses: ${error.message}`;
    }
  },
});

/**
 * Tool for getting lecture details
 */
export const getLectureDetail = tool({
  description: 'Retrieve the full content and details of a specific lecture. Requires a lecture ID.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The unique ID of the lecture' }
    },
    required: ['id']
  }),
  execute: async ({ id }) => {
    try {
      if (!id) return "Error: Missing required parameter 'id'.";
      console.log(`🔍 Executing getLectureDetail for: ${id}`);
      const lecture = await prisma.lectures.findUnique({
        where: { Id: id },
        include: {
          Sections: {
            include: {
              Courses: true
            }
          }
        }
      });

      if (!lecture) {
        return `Lecture with ID ${id} not found.`;
      }

      return {
        title: lecture.Title,
        content: lecture.Content,
        course: lecture.Sections?.Courses?.Title || 'Unknown Course',
        section: lecture.Sections?.Title || 'Unknown Section'
      };
    } catch (error) {
      console.error(`❌ getLectureDetail error:`, error.message);
      return `Error retrieving lecture details: ${error.message}`;
    }
  },
});

/**
 * Tool for getting article details
 */
export const getArticleDetail = tool({
  description: 'Retrieve the full content and details of a specific article. Requires an article ID.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      id: { type: 'string', description: 'The unique ID of the article' }
    },
    required: ['id']
  }),
  execute: async ({ id }) => {
    try {
      if (!id) return "Error: Missing required parameter 'id'.";
      console.log(`🔍 Executing getArticleDetail for: ${id}`);
      const article = await prisma.articles.findUnique({
        where: { Id: id }
      });

      if (!article) {
        return `Article with ID ${id} not found.`;
      }

      return {
        title: article.Title,
        content: article.Content,
        status: article.Status
      };
    } catch (error) {
      console.error(`❌ getArticleDetail error:`, error.message);
      return `Error retrieving article details: ${error.message}`;
    }
  },
});

