import prisma from "../src/lib/prisma.js";

/**
 * Script to check MCQ questions for Java Course
 */

async function checkJavaMCQ() {
  try {
    console.log("🔍 Checking MCQ questions for Java Course...\n");

    // Find Java Course
    const javaCourse = await prisma.courses.findFirst({
      where: {
        Title: {
          contains: "Java",
          mode: "insensitive",
        },
      },
      include: {
        Sections: {
          include: {
            Assignments: {
              include: {
                McqQuestions: {
                  include: {
                    McqChoices: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!javaCourse) {
      console.log("❌ Java Course not found!");
      return;
    }

    console.log(`✅ Found course: ${javaCourse.Title}`);
    console.log(`   Course ID: ${javaCourse.Id}\n`);

    let totalQuestions = 0;
    let totalAssignments = 0;

    for (const section of javaCourse.Sections) {
      if (section.Assignments.length > 0) {
        console.log(`📂 Section: ${section.Title}`);

        for (const assignment of section.Assignments) {
          totalAssignments++;
          const questionCount = assignment.McqQuestions.length;
          totalQuestions += questionCount;

          console.log(`   📝 Assignment: ${assignment.Name}`);
          console.log(`      - Questions: ${questionCount}`);
          console.log(`      - Duration: ${assignment.Duration} minutes`);
          console.log(`      - Grade to pass: ${assignment.GradeToPass}`);

          if (questionCount > 0) {
            console.log(`      - Sample question:`);
            const q = assignment.McqQuestions[0];
            console.log(`        Q: ${q.Content}`);
            console.log(`        Choices: ${q.McqChoices.length}`);
            q.McqChoices.forEach((choice, idx) => {
              console.log(
                `          ${idx + 1}. ${choice.Content} ${choice.IsCorrect ? "✓" : ""}`,
              );
            });
          }
          console.log();
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total Assignments: ${totalAssignments}`);
    console.log(`   Total Questions: ${totalQuestions}`);

    if (totalQuestions === 0) {
      console.log(`\n💡 No MCQ questions found. You may need to create some.`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJavaMCQ();
