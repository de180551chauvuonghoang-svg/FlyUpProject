import { AIQuestionGenerationService } from '../../services/ai/aiQuestionGenerationService.js';
import prisma from '../../lib/prisma.js';

/**
 * Controller for bulk generating AI questions into a Question Bank
 */
export const bulkGenerateToBank = async (req, res) => {
  try {
    const { questionBankId, courseId, lessonId, count = 10, difficulty = 'Mixed' } = req.body;


    if (!questionBankId || !courseId) {
      return res.status(400).json({ error: "questionBankId and courseId are required" });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ error: "User context missing. Please login again." });
    }


    // 1. Verify access (Instructor must own the bank)
    const bank = await prisma.questionBanks.findUnique({
      where: { Id: questionBankId }
    });

    if (!bank) return res.status(404).json({ error: "Question Bank not found" });
    
    // Simple owner check
    if (bank.CreatorId !== req.user.userId && req.user.role !== 'Admin') {
      return res.status(403).json({ error: "Unauthorized access to this question bank" });
    }

    // 2. Generate questions using AI
    const generatedQuestions = await AIQuestionGenerationService.generateQuestionsFromCourseContent(
      courseId, 
      count, 
      difficulty,
      lessonId
    );

    // 3. Save to database (Transactionally)
    console.log(`💾 Saving ${generatedQuestions.length} AI questions to bank ${questionBankId}...`);
    
    const savedCount = await prisma.$transaction(async (tx) => {
      let created = 0;

      for (const q of generatedQuestions) {
        // Create the question record
        // Map difficulty to IRT parameters
        let paramB = 0.0;
        if (q.difficulty === 'Easy') paramB = -1.0;
        else if (q.difficulty === 'Hard') paramB = 1.0;

        await tx.questionBankQuestions.create({
          data: {
            QuestionBankId: questionBankId,
            Content: q.content,
            Difficulty: q.difficulty || 'Medium',
            ParamA: 1.0,
            ParamB: paramB,
            ParamC: 0.25,
            Explanation: q.explanation || '',
            Status: 'Published',


            CreatorId: req.user.userId,
            LastModifierId: req.user.userId,
            QuestionBankChoices: {
              create: q.choices.map((c, idx) => ({
                Content: c.content,
                IsCorrect: c.isCorrect,
                OrderIndex: idx
              }))
            }
          }
        });
        created++;
      }

      return created;
    }, {
      timeout: 60000 // Increase timeout to 60 seconds for bulk AI generation
    });


    return res.status(200).json({
      success: true,
      message: `Successfully generated and saved ${savedCount} AI questions to the bank`,
      count: savedCount
    });

  } catch (error) {
    console.error(`❌ bulkGenerateToBank Error:`, error);
    return res.status(500).json({ 
      error: "Internal server error during question generation",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
