import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580";
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
      orderBy: {
        Sections: {
          Index: "asc",
        },
      },
    });
    console.log("Success! Items: " + assignments.length);
  } catch (err) {
    console.error("PRISMA ERROR:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
check();
