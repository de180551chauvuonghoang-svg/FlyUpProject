import { PDFParse } from 'pdf-parse';
import { getGroqClient } from '../../utils/ai-providers/groqClient.js';
import prisma from '../../lib/prisma.js';
import axios from 'axios';




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
  async generateQuestionsFromCourseContent(courseId, count = 10, difficulty = 'Mixed', lessonId = null) {
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
        console.log(`[DEBUG] Found lecture: ${lecture.Title}, Section: ${lecture.Sections?.Title}`);
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
      console.log(`[DEBUG] Context built: ${sanitizedContent.length} chars`);


      // 2.5 Check context quality
      if (sanitizedContent.length < 50) {
        console.warn('⚠️ AI Context is very short. Questions might be generic.');
      }

      // 3. Prepare AI Prompt
      const maxRetries = 2;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        // ... Logic for systemPrompt, completion, parsing, validation ...
        // (Moving existing logic inside)
        const existingQuestionsData = await prisma.mcqQuestions.findMany({
          where: { Assignments: { CourseId: courseId } },
          select: { Content: true },
          orderBy: { Id: 'desc' },
          take: 20
        });
        const existingQuestionContents = existingQuestionsData.map(q => q.Content);
        const avoidSection = existingQuestionContents.length > 0 
          ? `\nIMPORTANT: Do NOT repeat these existing ones:\n- ${existingQuestionContents.join('\n- ')}`
          : "";

        const systemPrompt = `You are a professional MCQ generator. You MUST output a JSON object.
Structure:
{
  "questions": [
    {
      "content": "string",
      "difficulty": "Easy" | "Medium" | "Hard",
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
IMPORTANT: Provide at least 2 questions for EACH level (Easy, Medium, Hard) when generating "Mixed" difficulty.
${avoidSection}`;

        let difficultyRequirement = `difficulty "${difficulty}"`;
        if (difficulty === 'Mixed' && count >= 10) {
            difficultyRequirement = `exactly ${count} questions with a MIXED distribution: AT LEAST 2 Easy, 2 Medium, and 2 Hard questions.`;
        }

        console.log(`🤖 [Attempt ${attempt + 1}/${maxRetries}] Generating ${count} AI questions...`);
        const client = getGroqClient();
        const completion = await client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Content: ${sanitizedContent}\n\nGenerate ${difficultyRequirement}` }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 4096,
        });

        const rawText = completion.choices[0]?.message?.content;
        if (!rawText) continue;

        let parsed;
        try { parsed = JSON.parse(rawText); } catch (e) { continue; }

        const questionsArr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.questions) ? parsed.questions : null);
        if (!questionsArr || questionsArr.length === 0) continue;

        const validatedQuestions = questionsArr.map(q => {
          let rawDiff = (q.difficulty || q.level || 'Medium').toString().trim();
          let normalizedDiff = 'Medium';
          if (/easy/i.test(rawDiff)) normalizedDiff = 'Easy';
          if (/hard/i.test(rawDiff)) normalizedDiff = 'Hard';
          if (/medium|inter|avg/i.test(rawDiff)) normalizedDiff = 'Medium';

          return {
            content: q.content || q.question || 'Untitled Question',
            difficulty: normalizedDiff,
            explanation: q.explanation || '',
            choices: (q.choices || []).map(c => ({
              content: c.content || c.text || '',
              isCorrect: !!(c.isCorrect || c.is_correct)
            }))
          };
        }).filter(q => q.choices.length >= 2 && q.choices.some(c => c.isCorrect));

        if (validatedQuestions.length === 0) continue;

        // Check distribution for Mixed
        if (difficulty === 'Mixed' && count >= 10) {
          const e = validatedQuestions.filter(q => q.difficulty === 'Easy').length;
          const m = validatedQuestions.filter(q => q.difficulty === 'Medium').length;
          const h = validatedQuestions.filter(q => q.difficulty === 'Hard').length;

          if ((e < 2 || m < 2 || h < 2) && attempt < maxRetries - 1) {
            console.warn(`⚠️ Distribution mix failed (E:${e}, M:${m}, H:${h}). Retrying...`);
            continue;
          }
        }

        console.log(`✅ Returning ${validatedQuestions.length} validated questions`);
        return validatedQuestions;
      }
      throw new Error('AI failed to generate valid questions after multiple attempts');


    } catch (error) {
      console.error(`❌ AIQuestionGenerationService Error:`, error.message);
      throw error;
    }
  }
};
