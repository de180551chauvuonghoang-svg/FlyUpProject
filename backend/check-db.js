import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDB() {
  try {
    const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580";
    
    const qb = await prisma.questionBanks.findMany({
      where: { CourseId: courseId },
      include: {
        QuestionBankQuestions: true
      }
    });

    const assignments = await prisma.assignments.findMany({
      where: {
        OR: [
          { Sections: { CourseId: courseId } },
          { CourseId: courseId }
        ]
      },
      include: {
        McqQuestions: true
      }
    });

    console.log("=== QUESTION BANKS ===");
    console.log(JSON.stringify(qb, null, 2));
    
    console.log("=== ASSIGNMENTS ===");
    console.log(JSON.stringify(assignments.map(a => ({ id: a.Id, Title: a.Name, Questions: a.McqQuestions.length })), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
