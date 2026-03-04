import prisma from "../lib/prisma.js";

/**
 * Get MCQ questions for a course
 */
export const getQuizQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`[QuizController] Fetching quiz for course: ${courseId}`);

    // Find all assignments for the course
    const assignments = await prisma.assignments.findMany({
      where: {
        Sections: {
          CourseId: courseId,
        },
      },
      include: {
        McqQuestions: {
          include: {
            McqChoices: {
              select: {
                Id: true,
                Content: true,
                // Don't send IsCorrect to frontend for security
              },
            },
          },
          take: parseInt(limit),
        },
      },
    });

    // Flatten all questions from all assignments
    let allQuestions = [];
    assignments.forEach((assignment) => {
      allQuestions = allQuestions.concat(
        assignment.McqQuestions.map((q) => ({
          id: q.Id,
          content: q.Content,
          difficulty: q.Difficulty,
          choices: q.McqChoices.map((c) => ({
            id: c.Id,
            content: c.Content,
          })),
        })),
      );
    });

    // Shuffle questions
    allQuestions = allQuestions.sort(() => Math.random() - 0.5);

    // Take only requested limit
    allQuestions = allQuestions.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        questions: allQuestions,
        total: allQuestions.length,
      },
    });
  } catch (error) {
    console.error("Get quiz error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch quiz questions",
    });
  }
};

/**
 * Submit quiz answers and get results
 */
export const submitQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { answers } = req.body; // { questionId: choiceId }
    const userId = req.user?.userId;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No answers provided",
      });
    }

    console.log(
      `[QuizController] Submit quiz for course: ${courseId}, user: ${userId}`,
    );

    const questionIds = Object.keys(answers);

    // Get all questions with correct answers
    const questions = await prisma.mcqQuestions.findMany({
      where: {
        Id: { in: questionIds },
      },
      include: {
        McqChoices: true,
      },
    });

    // Calculate score
    let correctCount = 0;
    const results = questions.map((question) => {
      const userChoiceId = answers[question.Id];
      const correctChoice = question.McqChoices.find((c) => c.IsCorrect);
      const isCorrect = userChoiceId === correctChoice?.Id;

      if (isCorrect) correctCount++;

      return {
        questionId: question.Id,
        question: question.Content,
        userAnswer: userChoiceId,
        correctAnswer: correctChoice?.Id,
        isCorrect,
        explanation: correctChoice?.Content,
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);

    res.json({
      success: true,
      data: {
        score,
        correctCount,
        totalQuestions: questions.length,
        results,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit quiz",
    });
  }
};
