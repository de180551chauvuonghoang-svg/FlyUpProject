import { getGroqClient } from '../../utils/ai-providers/groqClient.js';
import prisma from '../../lib/prisma.js';
import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

/**
 * Service for generating MCQ questions specifically from course content.
 * Uses Groq SDK directly with json_object mode for guaranteed JSON output.
 */
export const AIQuestionGenerationService = {
  /**
   * Generate questions based on course lectures and materials
   * @param {string} courseId - The ID of the course
   * @param {number} count - Number of questions to generate
   * @param {string} difficulty - Preferred difficulty ('Easy', 'Medium', 'Hard', 'Mixed')
   * @param {string|null} lessonId - Optional: generate from a specific lesson's materials
   * @returns {Promise<Array>} Array of generated questions
   */
  async generateQuestionsFromCourseContent(courseId, count = 5, difficulty = 'Mixed', lessonId = null) {
    try {
      // 1. Fetch relevant content
      let lectures = [];
      let courseInfo = { title: '', description: '' };

      if (lessonId) {
        console.log(`🔍 Fetching materials for specific lesson: ${lessonId}`);
        const lecture = await prisma.lectures.findUnique({
          where: { Id: lessonId },
          include: {
            LectureMaterial: true, // Fetch all to avoid case mismatch
            Sections: {
              select: {
                Courses: { select: { Title: true, Description: true } }
              }
            }
          }
        });

        if (!lecture) throw new Error(`Lesson ${lessonId} not found`);
        lectures = [lecture];
        courseInfo.title = lecture.Sections?.Courses?.Title || '';
        courseInfo.description = lecture.Sections?.Courses?.Description || '';
      } else {
        const course = await prisma.courses.findUnique({
          where: { Id: courseId },
          select: {
            Title: true,
            Description: true,
            Sections: {
              include: {
                Lectures: {
                  include: {
                    LectureMaterial: true // Fetch all to avoid case mismatch
                  }
                }
              }
            }
          }
        });
        if (!course) throw new Error(`Course ${courseId} not found`);
        courseInfo.title = course.Title;
        courseInfo.description = course.Description;
        course.Sections.forEach(s => { if (s.Lectures) lectures.push(...s.Lectures); });
      }

      // 2. Build context from materials + lecture content
      let materialContent = '';
      let fallbackContent = `Course: ${courseInfo.title}\n${courseInfo.description}\n\n`;
      let hasMaterials = false;

      for (const lecture of lectures) {
        fallbackContent += `### Lecture: ${lecture.Title}\n`;
        if (lecture.Content) {
          fallbackContent += `${lecture.Content.substring(0, 1500)}\n`;
        }

        if (lecture.LectureMaterial?.length > 0) {
          for (const material of lecture.LectureMaterial) {
            try {
              const url = material.Url.toLowerCase();
              const isPlainText = url.endsWith('.txt') || url.endsWith('.md');
              const isPdf = url.endsWith('.pdf');
              const materialTypeRaw = material.Type || '';
              const isDocumentType = materialTypeRaw.toLowerCase() === 'document';

              console.log(`🔍 [AI] Material processing: ${material.Url} (Type: ${materialTypeRaw}, isDocument: ${isDocumentType})`);

              if (isPlainText || (isDocumentType && !isPdf)) {
                console.log(`📄 Fetching text material: ${material.Url}`);
                const response = await axios.get(material.Url, { timeout: 6000, responseType: 'text' });
                if (typeof response.data === 'string' && response.data.length > 20) {
                  materialContent += `\n=== DOCUMENT: ${material.Name || 'material'} ===\n${response.data.substring(0, 3000)}\n`;
                  hasMaterials = true;
                }
              } else if (isPdf) {
                console.log(`📄 Extracting text from PDF: ${material.Url}`);
                const response = await axios.get(material.Url, { timeout: 10000, responseType: 'arraybuffer' });


                const parser = new PDFParse({ data: response.data });
                const data = await parser.getText();
                await parser.destroy();

                if (data.text) {
                  const rawText = data.text.trim();
                  console.log(`✅ [AI] Extracted ${rawText.length} chars. Preview: "${rawText.substring(0, 100).replace(/\n/g, ' ')}..."`);

                  if (rawText.length > 20) {
                    // Clean up multiple spaces/newlines from PDF extraction
                    const cleanText = rawText.replace(/\s+/g, ' ').substring(0, 4000);
                    materialContent += `\n=== PDF CONTENT: ${material.Name || 'document'} ===\n${cleanText}\n`;
                    hasMaterials = true;
                  }
                } else {
                  console.warn(`⚠️ [AI] PDF extraction returned no text for ${material.Url}`);
                }
              } else {
                // For other types (video, etc.), just add the name/info as context
                materialContent += `\n=== MATERIAL: ${material.Name || material.Type} ===\n(Type: ${material.Type}, URL: ${material.Url})\n`;
              }
            } catch (fetchErr) {
              console.warn(`⚠️ Could not process material: ${material.Url} — ${fetchErr.message}`);
            }
          }
        }
      }

      const contextContent = `${fallbackContent}\n${materialContent}`;
      const sanitizedContent = contextContent.substring(0, 5000);

      // 2.5 Check context quality
      if (sanitizedContent.length < 50) {
        console.warn('⚠️ AI Context is very short. Questions might be generic.');
      }

      // 3. Build prompt
      // 3.1 Fetch existing questions to avoid repetition (limit to 20 recent ones)
      const existingQuestionsData = await prisma.mcqQuestions.findMany({
        where: {
          Assignments: {
            CourseId: courseId
          }
        },
        select: { Content: true },
        orderBy: { Id: 'desc' },
        take: 20
      });
      const existingQuestionContents = existingQuestionsData.map(q => q.Content);
      const avoidSection = existingQuestionContents.length > 0 
        ? `\nIMPORTANT: Do NOT repeat or generate questions similar to these existing ones:\n- ${existingQuestionContents.join('\n- ')}`
        : "";

      const systemPrompt = `You are a professional MCQ generator. You MUST output a JSON object with the following structure:
{
  "questions": [
    {
      "content": "string",
      "difficulty": "${difficulty}",
      "explanation": "string",
      "choices": [
        { "content": "string", "isCorrect": true },
        { "content": "string", "isCorrect": false },
        { "content": "string", "isCorrect": false },
        { "content": "string", "isCorrect": false }
      ]
    }
  ]
}
Base questions ONLY on the provided content. Focus on specific facts. ${avoidSection}
Output ONLY valid JSON.`;

      const userPrompt = `Content to generate questions from:
${sanitizedContent}

Generate exactly ${count} MCQ questions with difficulty "${difficulty}" based on the content above. Ensure variety in topics covered.`;

      console.log(`🤖 Generating ${count} AI questions (model: llama-3.3-70b-versatile, context: ${sanitizedContent.length} chars)`);

      // 4. Call Groq SDK with json_object mode
      const client = getGroqClient();
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5, // Increased for more variety while maintaining logic
        max_tokens: 4096,
      });

      const rawText = completion.choices[0]?.message?.content;
      if (!rawText) throw new Error('AI returned empty response');

      console.log(`✅ AI responded (${rawText.length} chars)`);

      // 5. Parse JSON
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseError) {
        console.error('❌ JSON parse failed. Raw response:', rawText);
        throw new Error(`Failed to parse AI JSON response: ${parseError.message}`);
      }

      // Extract array — could be { questions: [...] } or directly [...]
      const questions = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.questions)
          ? parsed.questions
          : null;

      if (!questions || questions.length === 0) {
        throw new Error('AI returned empty question array');
      }

      // 6. Validate and normalize
      const validatedQuestions = questions
        .map(q => ({
          content: q.content || q.question || 'Untitled Question',
          difficulty: q.difficulty || 'Medium',
          explanation: q.explanation || '',
          choices: Array.isArray(q.choices)
            ? q.choices.map(c => ({
              content: c.content || c.text || '',
              isCorrect: !!c.isCorrect
            }))
            : []
        }))
        .filter(q => q.choices.length >= 2 && q.choices.some(c => c.isCorrect));

      if (validatedQuestions.length === 0) {
        throw new Error('None of the generated questions passed validation');
      }

      console.log(`✅ Returning ${validatedQuestions.length} validated questions`);
      return validatedQuestions;

    } catch (error) {
      console.error(`❌ AIQuestionGenerationService Error:`, error.message);
      throw error;
    }
  }
};
