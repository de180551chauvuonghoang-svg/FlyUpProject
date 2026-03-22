import prisma from "../lib/prisma.js";
import {
  startCatQuizService,
  answerCatQuestionService,
  finishCatQuizService,
} from "../services/catQuizService.js";
import {
  createAssignmentFromQuestionBankService,
  listAssignmentsByQuestionBankService,
  getAssignmentSnapshotDetailService,
} from "../services/assignmentSnapshotService.js";

/**
 * Get list of assignments for a course
 */
export const getAssignmentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    console.log(`[QuizController] Fetching assignments for course: ${courseId}`);

    const assignments = await prisma.assignments.findMany({
      where: {
        Sections: {
          CourseId: courseId,
        },
      },
      select: {
        Id: true,
        Name: true,
        Duration: true,
        QuestionCount: true,
        GradeToPass: true,
        SectionId: true,
        Sections: {
          select: {
            Title: true,
          },
        },
      },
      orderBy: {
        Sections: {
          Index: "asc",
        },
      },
    });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch assignments",
    });
  }
};

/**
 * Get submission history for a user + assignment
 */
export const getSubmissionHistory = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    console.log(
      `[QuizController] Fetching submissions for assignment: ${assignmentId}, user: ${userId}`
    );

    const submissions = await prisma.submissions.findMany({
      where: {
        AssignmentId: assignmentId,
        CreatorId: userId,
      },
      select: {
        Id: true,
        Mark: true,
        TimeSpentInSec: true,
        CreationTime: true,
        Assignments: {
          select: {
            GradeToPass: true,
            QuestionCount: true,
          },
        },
      },
      orderBy: {
        CreationTime: "desc",
      },
    });

    res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("Get submission history error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch submission history",
    });
  }
};

/**
 * Get MCQ questions for a course
 */
export const getQuizQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { limit = 10 } = req.query;

    console.log(`[QuizController] Fetching quiz for course: ${courseId}`);

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
              },
            },
          },
          take: parseInt(limit, 10),
        },
      },
    });

    let allQuestions = [];
    assignments.forEach((assignment) => {
      if (assignment.McqQuestions) {
        allQuestions = allQuestions.concat(
          assignment.McqQuestions.map((q) => ({
            id: q.Id,
            content: q.Content,
            difficulty: q.Difficulty,
            choices: q.McqChoices
              ? q.McqChoices.map((c) => ({
                id: c.Id,
                content: c.Content,
              }))
              : [],
          }))
        );
      }
    });

    allQuestions = allQuestions.sort(() => Math.random() - 0.5);
    allQuestions = allQuestions.slice(0, parseInt(limit, 10));

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
    const { answers } = req.body;
    const userId = req.user?.userId;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No answers provided",
      });
    }

    console.log(
      `[QuizController] Submit quiz for course: ${courseId}, user: ${userId}`
    );

    const questionIds = Object.keys(answers);

    const questions = await prisma.mcqQuestions.findMany({
      where: {
        Id: { in: questionIds },
      },
      include: {
        McqChoices: true,
      },
    });

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

/**
 * Start CAT quiz
 */
export const startCatQuiz = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { assignmentId, courseId, questionCount } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = await startCatQuizService({
      userId,
      courseId,
      assignmentId,
      questionCount,
    });

    return res.json(data);
  } catch (error) {
    console.error("startCatQuiz error:", error);
    return res.status(400).json({
      error: error.message || "Failed to start CAT quiz",
    });
  }
};

/**
 * Answer one CAT question and get next question
 */
export const answerCatQuestion = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const {
      assignmentId,
      courseId,
      questionCount,
      currentQuestionId,
      selectedChoiceId,
      answeredQuestions,
      responses,
      currentTheta,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = await answerCatQuestionService({
      userId,
      courseId,
      assignmentId,
      questionCount,
      currentQuestionId,
      selectedChoiceId,
      answeredQuestions,
      responses,
      currentTheta,
    });

    return res.json(data);
  } catch (error) {
    console.error("answerCatQuestion error:", error);
    return res.status(400).json({
      error: error.message || "Failed to answer CAT question",
    });
  }
};

/**
 * Finish CAT quiz and persist results
 */
export const finishCatQuiz = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const {
      assignmentId,
      courseId,
      answeredQuestions,
      responses,
      selectedChoiceIds,
      timeSpentInSec,
      initialTheta,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = await finishCatQuizService({
      userId,
      courseId,
      assignmentId,
      answeredQuestions,
      responses,
      selectedChoiceIds,
      timeSpentInSec,
      initialTheta,
    });

    return res.json(data);
  } catch (error) {
    console.error("finishCatQuiz error:", error);
    return res.status(400).json({
      error: error.message || "Failed to finish CAT quiz",
    });
  }
};

export const createAssignmentFromBank = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const {
      courseId,
      sectionId,
      name,
      duration,
      gradeToPass,
      sourceQuestionBankId,
    } = req.body;

    const data = await createAssignmentFromQuestionBankService({
      userId,
      courseId,
      sectionId,
      name,
      duration,
      gradeToPass,
      sourceQuestionBankId,
    });

    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("createAssignmentFromBank error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to create assignment from question bank",
    });
  }
};

export const getSectionsByCourseForInstructor = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.userId;

    const sections = await prisma.sections.findMany({
      where: {
        CourseId: courseId,
        Courses: {
          CreatorId: userId,
        },
      },
      select: {
        Id: true,
        Title: true,
        Index: true,
        CourseId: true,
      },
      orderBy: {
        Index: "asc",
      },
    });

    res.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    console.error("getSectionsByCourseForInstructor error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to fetch sections",
    });
  }
};

export const getAssignmentsByQuestionBank = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { questionBankId } = req.params;

    const data = await listAssignmentsByQuestionBankService({
      userId,
      questionBankId,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getAssignmentsByQuestionBank error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to fetch assignments by question bank",
    });
  }
};

export const getAssignmentSnapshotDetail = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { assignmentId } = req.params;

    console.log("DEBUG: getAssignmentSnapshotDetail Params:", { userId, assignmentId });

    const data = await getAssignmentSnapshotDetailService({
      userId,
      assignmentId,
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getAssignmentSnapshotDetail error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Failed to fetch assignment detail",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};