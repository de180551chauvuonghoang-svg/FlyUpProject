import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580";
    
    // Test getQuizQuestions
    console.log("Testing get questions...");
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
    console.log(`Found ${qbQuestions.length} questions`);

    if (qbQuestions.length > 0) {
      const q = qbQuestions[0];
      const questionIds = [q.Id];
      
      console.log("Testing submit questions...");
      const questions = await prisma.questionBankQuestions.findMany({
        where: {
          Id: { in: questionIds },
        },
        include: {
          QuestionBankChoices: true,
        },
      });
      console.log(`Found ${questions.length} questions for submit`);
    }
    
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
