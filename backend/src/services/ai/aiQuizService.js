import prisma from '../../lib/prisma.js';

/**
 * Save AI-generated quiz, questions, and choices into dedicated tables.
 */
export async function saveAiQuiz({ courseId, lessonId, creatorId, difficulty, questions }) {
  return prisma.$transaction(async (tx) => {
    const quiz = await tx.aiQuizzes.create({
      data: {
        CourseId: courseId,
        LessonId: lessonId || null,
        CreatorId: creatorId,
        Difficulty: difficulty || 'Mixed',
        QuestionCount: questions.length,
        AiQuizQuestions: {
          create: questions.map((q) => ({
            Content: q.content,
            Difficulty: q.difficulty || 'Medium',
            Explanation: q.explanation || '',
            AiQuizChoices: {
              create: (q.choices || []).map((c) => ({
                Content: c.content,
                IsCorrect: !!c.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        AiQuizQuestions: {
          include: {
            AiQuizChoices: true,
          },
        },
      },
    });

    return quiz;
  });
}

/**
 * Fetch a single AI Quiz by its ID.
 */
export async function getAiQuizById(aiQuizId) {
  return prisma.aiQuizzes.findUnique({
    where: { Id: aiQuizId },
    include: {
      AiQuizQuestions: {
        include: {
          AiQuizChoices: true,
        },
      },
    },
  });
}

/**
 * List AI quizzes for a specific lesson/course for a user.
 */
export async function getAiQuizzesByLesson({ courseId, lessonId, creatorId }) {
  return prisma.aiQuizzes.findMany({
    where: {
      CourseId: courseId,
      LessonId: lessonId || null,
      CreatorId: creatorId,
    },
    include: {
      AiQuizQuestions: {
        include: {
          AiQuizChoices: true,
        },
      },
    },
    orderBy: {
      CreationTime: 'desc',
    },
  });
}
