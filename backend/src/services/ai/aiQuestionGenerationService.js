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
            LectureMaterial: { where: { Type: 'document' } },
            Sections: {
              select: {
                Course: { select: { Title: true, Description: true } }
              }
            }
          }
        });

        if (!lecture) throw new Error(`Lesson ${lessonId} not found`);
        lectures = [lecture];
        courseInfo.title = lecture.Sections?.Course?.Title || '';
        courseInfo.description = lecture.Sections?.Course?.Description || '';
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
                    LectureMaterial: { where: { Type: 'document' } }
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
          fallbackContent += `${lecture.Content.substring(0, 800)}\n`;
        }

        if (lecture.LectureMaterial?.length > 0) {
          for (const material of lecture.LectureMaterial) {
            try {
              console.log(`📄 Fetching material: ${material.Url}`);
              const response = await axios.get(material.Url, { timeout: 6000, responseType: 'text' });
              if (typeof response.data === 'string' && response.data.length > 20) {
                materialContent += `\n=== DOCUMENT: ${material.Name || 'material'} ===\n${response.data.substring(0, 2500)}\n`;
                hasMaterials = true;
              }
            } catch (fetchErr) {
              console.warn(`⚠️ Could not fetch material: ${material.Url} — ${fetchErr.message}`);
            }
          }
        }
      }

      const contextContent = hasMaterials
        ? `Course: ${courseInfo.title}\n\n${materialContent}`
        : fallbackContent;

      const sanitizedContent = contextContent.substring(0, 5000);

      // 3. Build prompt
      const systemPrompt = `You are an expert educational assessment designer. Your task is to generate ${count} multiple-choice questions (MCQs) in STRICT JSON format when given educational content.

IMPORTANT: You MUST respond with ONLY a valid JSON object with this exact structure:
{
  "questions": [
    {
      "content": "Question text here?",
      "difficulty": "Easy",
      "explanation": "Why the correct answer is correct.",
      "choices": [
        { "content": "Correct answer", "isCorrect": true },
        { "content": "Wrong option A", "isCorrect": false },
        { "content": "Wrong option B", "isCorrect": false },
        { "content": "Wrong option C", "isCorrect": false }
      ]
    }
  ]
}

Rules:
- Generate exactly ${count} questions.
- Each question has exactly 4 choices with exactly 1 correct.
- Difficulty must be one of: Easy, Medium, Hard.
- Base questions on the provided content.
- Output ONLY the JSON object, no markdown, no extra text.`;

      const userPrompt = `Generate ${count} MCQ questions with difficulty "${difficulty}" from the following content:\n\n${sanitizedContent}`;

      console.log(`🤖 Generating ${count} AI questions (model: llama-3.3-70b-versatile, context: ${sanitizedContent.length} chars)`);

      // 4. Call Groq SDK with json_object mode
      const client = getGroqClient();
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.6,
        max_tokens: 8192,
        response_format: { type: 'json_object' }
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
