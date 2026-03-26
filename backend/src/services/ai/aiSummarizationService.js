import { generateText } from 'ai';
import { getGroqProvider } from '../../utils/ai-providers/groqClient.js';
import prisma from '../../lib/prisma.js';
import axios from 'axios';

/**
 * Service for summarizing various types of documents within the system
 */
export const AISummarizationService = {
  /**
   * Summarize a document by its ID and type
   * @param {string} id - The ID of the document/lecture/article
   * @param {string} type - The type ('lecture', 'article', 'material')
   * @param {string} language - Target language for summary (default: 'vi')
   * @returns {Promise<Object>} Summary result
   */
  async summarize(id, type, language = 'vi') {
    try {
      let content = '';
      let title = '';

      // 1. Fetch content based on type
      switch (type) {
        case 'lecture':
          const lecture = await prisma.lectures.findUnique({
            where: { Id: id },
            select: { Title: true, Content: true }
          });
          if (!lecture) throw new Error(`Lecture ${id} not found`);
          title = lecture.Title;
          content = lecture.Content;
          break;

        case 'article':
          const article = await prisma.articles.findUnique({
            where: { Id: id },
            select: { Title: true, Content: true }
          });
          if (!article) throw new Error(`Article ${id} not found`);
          title = article.Title;
          content = article.Content;
          break;

        case 'material':
          const material = await prisma.lectureMaterial.findFirst({
            where: { 
              OR: [
                { id: isNaN(parseInt(id)) ? -1 : parseInt(id) },
                { Url: { contains: id } } // Allow finding by URL fragment or ID
              ]
            }
          });
          if (!material) throw new Error(`Material ${id} not found`);
          
          if (material.Type !== 'document') {
            throw new Error(`Summarization is only supported for documents, not ${material.Type}`);
          }

          // Fetch external content (assume it's text-based for now)
          // For PDF, we'd need a PDF parser. For now, let's just try to fetch as text.
          const response = await axios.get(material.Url);
          content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          title = `Material: ${material.Url.split('/').pop()}`;
          break;

        default:
          throw new Error(`Invalid document type: ${type}`);
      }

      if (!content || content.trim().length < 50) {
        return {
          success: true,
          title,
          summary: content || 'Nội dung quá ngắn để tóm tắt.',
          isShort: true
        };
      }

      // 2. Generate summary using AI
      const groq = getGroqProvider();
      const model = groq('llama-3.3-70b-versatile');

      const prompt = `
        Bạn là một trợ lý AI học thuật chuyên nghiệp. Hãy tóm tắt nội dung sau đây một cách súc tích, dễ hiểu và giữ lời giọng văn sư phạm.
        Yêu cầu:
        - Ngôn ngữ: ${language === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'}
        - Hình thức: Sử dụng bullet points cho các ý chính.
        - Giới hạn: Khoảng 3-5 câu hoặc 150-200 từ.
        - Tiêu đề gốc: ${title}

        Nội dung cần tóm tắt:
        ${content}
      `;

      const { text } = await generateText({
        model,
        prompt,
        temperature: 0.3,
      });

      return {
        success: true,
        title,
        summary: text,
        type,
        id
      };
    } catch (error) {
      console.error(`❌ AISummarizationService Error:`, error.message);
      throw error;
    }
  }
};
