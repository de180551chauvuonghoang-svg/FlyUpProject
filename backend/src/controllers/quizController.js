import prisma from "../lib/prisma.js";
import Groq from "groq-sdk";
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
        OR: [
          { Sections: { CourseId: courseId } },
          { CourseId: courseId }
        ]
      },
      select: {
        Id: true,
        Name: true,
        Duration: true,
        QuestionCount: true,
        GradeToPass: true,
        SectionId: true,
        CourseId: true,
        Sections: {
          select: {
            Title: true,
            Index: true
          },
        },
        McqQuestions: {
          select: {
            Id: true,
            Content: true,
            Difficulty: true,
            AssignmentId: true,
            McqChoices: {
              select: {
                Id: true,
                Content: true,
                IsCorrect: true
              }
            }
          }
        }
      },
    });

    console.log(`[QuizController] Found ${assignments.length} assignments.`);

    // Manually sort by Section Index if needed
    assignments.sort((a, b) => {
      const idxA = a.Sections?.Index ?? 0;
      const idxB = b.Sections?.Index ?? 0;
      return idxA - idxB;
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
 * Create a new assignment
 */
export const createAssignment = async (req, res) => {
  try {
    const { name, duration, gradeToPass, sectionId, courseId, questions } = req.body;
    const userId = req.user?.userId;

    console.log(`[QuizController] Creating assignment: ${name}`);

    const result = await prisma.assignments.create({
      data: {
        Name: name,
        Duration: parseInt(duration) || 30,
        GradeToPass: parseFloat(gradeToPass) || 8,
        SectionId: sectionId || null,
        CourseId: courseId || null,
        CreatorId: userId,
        QuestionCount: questions?.length || 0,
        McqQuestions: {
          create: questions?.map((q) => ({
            Content: q.content,
            Difficulty: q.difficulty || "Medium",
            McqChoices: {
              create: q.choices.map((c) => ({
                Content: c.content,
                IsCorrect: c.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        McqQuestions: {
          include: { McqChoices: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create assignment",
    });
  }
};

/**
 * Update an existing assignment
 */
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, gradeToPass, questions } = req.body;

    console.log(`[QuizController] Updating assignment: ${id}`);

    // First, delete old questions (cascade will handle choices)
    await prisma.mcqQuestions.deleteMany({
      where: { AssignmentId: id },
    });

    const result = await prisma.assignments.update({
      where: { Id: id },
      data: {
        Name: name,
        Duration: parseInt(duration) || 30,
        GradeToPass: parseFloat(gradeToPass) || 8,
        QuestionCount: questions?.length || 0,
        McqQuestions: {
          create: questions?.map((q) => ({
            Content: q.content,
            Difficulty: q.difficulty || "Medium",
            McqChoices: {
              create: q.choices.map((c) => ({
                Content: c.content,
                IsCorrect: c.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        McqQuestions: {
          include: { McqChoices: true },
        },
      },
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update assignment",
    });
  }
};

/**
 * Delete an assignment
 */
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[QuizController] Deleting assignment: ${id}`);

    await prisma.assignments.delete({
      where: { Id: id },
    });

    res.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete assignment",
    });
  }
};

/**
 * Get MCQ questions for a course or specific section's assignments
 */
export const getQuizQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sectionId, limit = 10 } = req.query;

    console.log(`[QuizController] Fetching quiz. Course: ${courseId}, Section: ${sectionId}`);

    let questions = [];

    // 1. Try Section-specific Assignments
    if (sectionId && sectionId !== "undefined") {
      const sectionAssignmentQuestions = await prisma.mcqQuestions.findMany({
        where: {
          Assignments: {
            SectionId: sectionId
          }
        },
        include: { McqChoices: true },
      });

      if (sectionAssignmentQuestions.length > 0) {
        console.log(`[QuizController] Found ${sectionAssignmentQuestions.length} questions from section assignments.`);
        questions = sectionAssignmentQuestions.map((q) => ({
          id: q.Id,
          content: q.Content,
          difficulty: q.Difficulty,
          type: 'assignment',
          choices: q.McqChoices.map((c) => ({
            id: c.Id,
            content: c.Content,
          })),
        }));
      }
    }

    // 2. Secondary: If no section questions, try Course-level Assignments
    if (questions.length === 0) {
      const courseAssignmentQuestions = await prisma.mcqQuestions.findMany({
        where: {
          Assignments: {
            CourseId: courseId,
            SectionId: null // Only true course-level assignments
          }
        },
        include: { McqChoices: true },
      });

      if (courseAssignmentQuestions.length > 0) {
        console.log(`[QuizController] Found ${courseAssignmentQuestions.length} questions from course assignments.`);
        questions = courseAssignmentQuestions.map((q) => ({
          id: q.Id,
          content: q.Content,
          difficulty: q.Difficulty,
          type: 'assignment_course',
          choices: q.McqChoices.map((c) => ({
            id: c.Id,
            content: c.Content,
          })),
        }));
      }
    }

    // 3. Fallback to Question Bank
    if (questions.length === 0) {
      console.log(`[QuizController] No assignment questions found. Falling back to Question Bank.`);
      const qbQuestions = await prisma.questionBankQuestions.findMany({
        where: {
          QuestionBanks: {
            CourseId: courseId,
          },
        },
        include: {
          QuestionBankChoices: {
            select: {
              Id: true,
              Content: true,
            },
          },
        },
      });

      questions = qbQuestions.map((q) => ({
        id: q.Id,
        content: q.Content,
        difficulty: q.Difficulty,
        type: 'questionbank',
        choices: q.QuestionBankChoices.map((c) => ({
          id: c.Id,
          content: c.Content,
        })),
      }));
    }

    // Randomize and limit to 10
    questions = questions.sort(() => Math.random() - 0.5);
    const finalQuestions = questions.slice(0, parseInt(limit, 10));

    res.json({
      success: true,
      data: {
        questions: finalQuestions,
        total: finalQuestions.length,
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

    console.log(`[QuizController] Submitting quiz. User: ${userId}, Course: ${courseId}, Questions: ${Object.keys(answers || {}).length}`);

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No answers provided",
      });
    }

    const questionIds = Object.keys(answers);

    // Try finding in McqQuestions (Assignments) first
    const mcqQuestions = await prisma.mcqQuestions.findMany({
      where: { Id: { in: questionIds } },
      include: { McqChoices: true }
    });

    // Then find in QuestionBankQuestions
    const qbQuestions = await prisma.questionBankQuestions.findMany({
      where: { Id: { in: questionIds } },
      include: { QuestionBankChoices: true }
    });

    console.log(`[QuizController] Found ${mcqQuestions.length} MCQ questions and ${qbQuestions.length} QB questions.`);

    const allQuestions = [
      ...mcqQuestions.map(q => ({
        Id: q.Id,
        Content: q.Content,
        choices: q.McqChoices
      })),
      ...qbQuestions.map(q => ({
        Id: q.Id,
        Content: q.Content,
        choices: q.QuestionBankChoices
      }))
    ];

    if (allQuestions.length === 0) {
      console.error("[QuizController] No valid questions found for IDs:", questionIds);
      return res.status(404).json({
        success: false,
        error: "Questions not found",
      });
    }

    let correctCount = 0;
    const results = allQuestions.map((question) => {
      const userChoiceId = answers[question.Id];
      const correctChoice = question.choices.find((c) => c.IsCorrect);
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

    const score = Math.round((correctCount / allQuestions.length) * 100);
    console.log(`[QuizController] Submit result: ${correctCount}/${allQuestions.length} correct. Score: ${score}%`);

    res.json({
      success: true,
      data: {
        score,
        correctCount,
        totalQuestions: allQuestions.length,
        results,
      },
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit quiz",
      details: error.message
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

/**
 * POST /api/quiz/cat/explain
 * Use AI (Groq) to explain why an answer is correct or incorrect
 * Also suggests relevant lectures to review
 */
export const explainQuizAnswer = async (req, res) => {
  try {
    const { questionContent, choices, selectedChoiceContent, correctChoiceContent, isCorrect, sectionId } = req.body;

    console.log("[explainQuizAnswer] Received:", {
      questionContent: questionContent?.slice(0, 50),
      selectedChoiceContent,
      correctChoiceContent,
      isCorrect,
      sectionId,
      choicesCount: choices?.length
    });

    if (!questionContent) {
      return res.status(400).json({ error: "Missing question content" });
    }
    if (!selectedChoiceContent) {
      return res.status(400).json({ error: "Missing selected choice content" });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("[explainQuizAnswer] GROQ_API_KEY not set!");
      return res.status(500).json({ error: "AI service is not configured" });
    }

    console.log("[explainQuizAnswer] GROQ_API_KEY present, length:", process.env.GROQ_API_KEY.length);

    // Fetch lectures in the section for review suggestions
    let lectureList = [];
    if (sectionId) {
      try {
        console.log("[explainQuizAnswer] Fetching lectures for section:", sectionId);
        const lectures = await prisma.lectures.findMany({
          where: { SectionId: sectionId },
          select: { Title: true },
          orderBy: { CreationTime: "asc" },
        });
        lectureList = lectures.map((l) => l.Title);
        console.log("[explainQuizAnswer] Found", lectureList.length, "lectures");
      } catch (e) {
        console.warn("[explainQuizAnswer] Could not fetch lectures:", e.message);
      }
    }

    console.log("[explainQuizAnswer] Calling Groq API...");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const choicesStr = (choices ?? []).map((c) => `- ${c.Content || c.content || ''}`).join("\n");
    const lecturesStr = lectureList.length > 0
      ? `\nAvailable lectures in this section:\n${lectureList.map((t, i) => `${i + 1}. ${t}`).join("\n")}`
      : "";

    const prompt = `You are "FlyUp AI Tutor", an encouraging and knowledgeable educational assistant.

A learner just answered a quiz question. Please provide a clear, concise explanation (max 120 words).

Question: "${questionContent}"

Choices:
${choicesStr}

Learner selected: "${selectedChoiceContent}"
${!isCorrect && correctChoiceContent ? `Correct answer: "${correctChoiceContent}"` : ""}
Result: ${isCorrect ? "CORRECT ✓" : "INCORRECT ✗"}
${lecturesStr}

Instructions:
1. ${isCorrect
      ? "Briefly confirm why this answer is correct. Reinforce the key concept."
      : "Explain why the selected answer is wrong and why the correct answer is right. Be encouraging, not discouraging."}
2. ${!isCorrect && lectureList.length > 0
      ? "Suggest the MOST relevant lecture from the list above that the learner should review. Format: '📚 Suggested review: [lecture name]'"
      : isCorrect ? "Optionally mention a related concept to deepen understanding." : ""}
3. Keep the tone friendly, supportive, and educational.
4. Use English language.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      temperature: 0.4,
      max_tokens: 400,
    });

    console.log("[explainQuizAnswer] Groq API success!");
    const explanation = completion.choices[0]?.message?.content?.trim() || "Unable to generate explanation.";
    return res.json({ 
      explanation,
      suggestedLectures: !isCorrect ? lectureList : [],
    });
  } catch (err) {
    console.error("[explainQuizAnswer] CAUGHT ERROR:", err.message);
    console.error("[explainQuizAnswer] Stack:", err.stack);
    return res.status(500).json({ error: "Failed to generate AI explanation", details: err.message });
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
      questionIds,
    } = req.body;
  
    const data = await createAssignmentFromQuestionBankService({
      userId,
      courseId,
      sectionId,
      name,
      duration,
      gradeToPass,
      sourceQuestionBankId,
      questionIds,
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