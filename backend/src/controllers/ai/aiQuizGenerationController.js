/**
 * AI Quiz Generation Controller
 *
 * Handles HTTP requests for adaptive quiz generation
 * Phase 5: API Controller & Router Implementation
 */

import { generateAdaptiveQuiz } from '../../services/ai/adaptiveQuizCurationService.js';
import { createQuizAssignment, getPrimarySectionId } from '../../utils/quizAssignmentFactory.js';
import { AIQuestionGenerationService } from '../../services/ai/aiQuestionGenerationService.js';
import prisma from '../../lib/prisma.js';

/**
 * Generate adaptive quiz
 * POST /api/ai/quiz/generate
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const generateQuiz = async (req, res) => {
  try {
    const { userId, courseId, scope, questionCount = 10, options = {} } = req.body;

    // Validate required fields
    if (!userId || !courseId || !scope) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Missing required fields: userId, courseId, scope',
        details: {
          userId: !!userId,
          courseId: !!courseId,
          scope: !!scope,
        }
      });
    }

    // Validate scope structure
    if (!scope.type || !['entire_course', 'specific_sections', 'weak_areas'].includes(scope.type)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_SCOPE',
        message: 'Invalid scope.type. Must be one of: entire_course, specific_sections, weak_areas'
      });
    }

    // Validate specific_sections scope
    if (scope.type === 'specific_sections' && (!scope.sectionIds || scope.sectionIds.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_SCOPE',
        message: 'specific_sections scope requires non-empty sectionIds array'
      });
    }

    // Authorization: users can only generate quizzes for themselves
    if (req.user.userId !== userId && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You can only generate quizzes for yourself'
      });
    }

    // Validate question count
    const validatedQuestionCount = Math.min(Math.max(1, questionCount), 50); // Clamp to 1-50

    console.log(`[Quiz Generation] Request from ${req.user.userId} for user ${userId}, scope: ${scope.type}, count: ${validatedQuestionCount}`);

    // Generate quiz
    const quiz = await generateAdaptiveQuiz(prisma, {
      userId,
      courseId,
      scope,
      questionCount: validatedQuestionCount,
      options
    });

    // Create persistent Assignment record
    const sectionId = await getPrimarySectionId(prisma, courseId);

    const assignment = await createQuizAssignment(prisma, {
      name: `AI Quiz - ${new Date().toLocaleDateString()}`,
      duration: validatedQuestionCount * 3, // 3 minutes per question
      gradeToPass: 60,
      sectionId,
      userId,
      courseId,
      scope,
      userTheta: quiz.metadata.userTheta,
      difficultyMix: quiz.metadata.difficultyMix,
      selectedQuestions: quiz.questions.map((q, idx) => {
        const isCat = idx < quiz.metadata.catQuestions;
        return {
          question: q,
          selectionMethod: isCat ? 'cat' : 'difficulty'
        };
      })
    });

    // Return quiz response
    return res.status(200).json({
      success: true,
      quizId: assignment.Id,
      assignmentId: assignment.Id,
      metadata: {
        ...quiz.metadata,
        generatedAt: new Date().toISOString(),
      },
      questions: quiz.questions.map(q => ({
        id: q.Id,
        content: q.Content,
        choices: q.McqChoices.map(choice => ({
          id: choice.Id,
          content: choice.Content,
          // Don't expose correct answer
        })),
        difficulty: q.Difficulty,
        hasIRT: !!(q.ParamA && q.ParamB && q.ParamC),
        sectionId: q.Assignments?.SectionId,
        sectionTitle: q.Assignments?.Sections?.Title,
      })),
      totalQuestions: quiz.questions.length,
      duration: assignment.Duration,
    });

  } catch (error) {
    console.error('[Quiz Generation] Error:', error);

    // Handle specific errors
    if (error.message.includes('Insufficient questions') || error.message.includes('No questions available')) {
      return res.status(400).json({
        success: false,
        error: 'INSUFFICIENT_QUESTIONS',
        message: error.message,
        suggestion: 'Try expanding scope or reducing question count'
      });
    }

    if (error.message === 'User not enrolled in course') {
      return res.status(403).json({
        success: false,
        error: 'NOT_ENROLLED',
        message: 'User is not enrolled in this course'
      });
    }

    if (error.message === 'Course has no sections') {
      return res.status(404).json({
        success: false,
        error: 'NO_SECTIONS',
        message: 'Course has no sections available'
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      error: 'QUIZ_GENERATION_FAILED',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to generate quiz'
    });
  }
};

/**
 * Generate instant AI questions from course/lesson content
 * POST /api/ai/quiz/generate-instant
 */
export const generateInstantAIQuiz = async (req, res) => {
  try {
    const { courseId, lessonId, count = 5, difficulty = 'Mixed' } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: "MISSING_COURSE_ID",
        message: "courseId is required"
      });
    }

    console.log(`🤖 Instant AI Quiz generation requested for course: ${courseId}`);

    // Generate questions using AI service
    const questions = await AIQuestionGenerationService.generateQuestionsFromCourseContent(
      courseId,
      count,
      difficulty,
      lessonId
    );

    // Save questions to database as an Assignment

    const sectionId = await getPrimarySectionId(prisma, courseId);
    const userId = req.user?.userId;

    const assignment = await createQuizAssignment(prisma, {
      name: `AI Practice Quiz - ${new Date().toLocaleDateString('vi-VN')}`,
      duration: count * 3, // 3 minutes per question
      gradeToPass: Math.ceil(count * 0.8), // 80% to pass
      sectionId,
      userId,
      courseId,
      scope: { type: 'instant', lessonId },
      userTheta: 0,
      difficultyMix: { [difficulty]: 1 },
      selectedQuestions: questions.map((q) => ({
        question: {
          Content: q.content,
          Difficulty: q.difficulty,
          ParamA: 1.0,
          ParamB: q.difficulty === 'Easy' ? -1.0 : q.difficulty === 'Hard' ? 1.0 : 0.0,
          ParamC: 0.25,
          McqChoices: q.choices.map((c) => ({
            Content: c.content,
            IsCorrect: !!c.isCorrect,
          })),
        },
        selectionMethod: 'instant'
      }))
    });

    console.log(`✅ Saved AI Quiz as Assignment ${assignment.Id}`);

    return res.status(200).json({
      success: true,
      data: {
        assignmentId: assignment.Id,
        totalQuestions: questions.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ generateInstantAIQuiz Error:`, error);
    return res.status(500).json({
      success: false,
      error: "INSTANT_AI_GENERATION_FAILED",
      message: error.message
    });
  }
};

/**
 * Health check for quiz generation service
 * GET /api/ai/quiz/health
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
export const getQuizGenerationHealth = async (req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connectivity (if available)
    let redisHealthy = true;
    try {
      const { default: redisClient } = await import('../../lib/cache.js');
      await redisClient.ping();
    } catch (error) {
      console.warn('[Quiz Health] Redis not available:', error.message);
      redisHealthy = false;
    }

    return res.status(200).json({
      success: true,
      service: 'quiz-generation',
      status: redisHealthy ? 'healthy' : 'degraded',
      database: {
        healthy: true,
      },
      cache: {
        provider: 'Redis',
        healthy: redisHealthy,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      service: 'quiz-generation',
      status: 'unhealthy',
      error: error.message
    });
  }
};






