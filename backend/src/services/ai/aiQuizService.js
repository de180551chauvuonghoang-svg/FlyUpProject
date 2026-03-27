import prisma from '../../lib/prisma.js';

/**
 * Save AI-generated quiz, questions, and choices into dedicated tables.
 */
export async function saveAiQuiz({ courseId, lessonId, creatorId, difficulty, questions }) {
  return prisma.$transaction(async (tx) => {
    // 1. Create Quiz Header
    const quiz = await tx.aiQuizzes.create({
      data: {
        CourseId: courseId,
        LessonId: lessonId || null,
        CreatorId: creatorId,
        Difficulty: difficulty || 'Mixed',
        QuestionCount: questions.length
      }
    });

    // 2. Create Questions & Choices sequentially
    for (const q of questions) {
      const question = await tx.aiQuizQuestions.create({
        data: {
          AiQuizId: quiz.Id,
          Content: q.content,
          Difficulty: q.difficulty || 'Medium',
          Explanation: q.explanation || ''
        }
      });

      if (q.choices && q.choices.length > 0) {
        await tx.aiQuizChoices.createMany({
          data: q.choices.map(c => ({
            AiQuizQuestionId: question.Id,
            Content: c.content,
            IsCorrect: !!c.isCorrect
          }))
        });
      }
    }

    // 3. Reload full quiz with relations to satisfy controller
    const fullQuiz = await tx.aiQuizzes.findUnique({
      where: { Id: quiz.Id },
      include: {
        AiQuizQuestions: {
          include: {
            AiQuizChoices: true
          }
        }
      }
    });

    return fullQuiz;
  }, {
    maxWait: 5000,
    timeout: 60000
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
