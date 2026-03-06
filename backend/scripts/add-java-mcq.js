import prisma from "../src/lib/prisma.js";

/**
 * Script to add sample MCQ questions for Java Course
 */

async function addJavaMCQ() {
  try {
    console.log("🚀 Adding MCQ questions for Java Course...\n");

    // Find Java Course assignment
    const assignment = await prisma.assignments.findFirst({
      where: {
        Sections: {
          Courses: {
            Title: {
              contains: "Java",
              mode: "insensitive",
            },
          },
        },
      },
    });

    if (!assignment) {
      console.log("❌ No assignment found for Java Course!");
      return;
    }

    console.log(`✅ Found assignment: ${assignment.Name}`);
    console.log(`   Assignment ID: ${assignment.Id}\n`);

    // Sample Java MCQ Questions
    const questions = [
      {
        content:
          "What is the result of the following JavaScript promise chain?",
        difficulty: "Medium",
        choices: [
          { content: "undefined", isCorrect: false },
          { content: "Syntax Error", isCorrect: false },
          { content: "Error caught", isCorrect: true },
          { content: "null", isCorrect: false },
        ],
      },
      {
        content: "What is the default value of a local variable in Java?",
        difficulty: "Easy",
        choices: [
          { content: "null", isCorrect: false },
          { content: "0", isCorrect: false },
          {
            content: "No default value (must be initialized)",
            isCorrect: true,
          },
          { content: "undefined", isCorrect: false },
        ],
      },
      {
        content: "Which of the following is NOT a Java access modifier?",
        difficulty: "Easy",
        choices: [
          { content: "public", isCorrect: false },
          { content: "private", isCorrect: false },
          { content: "protected", isCorrect: false },
          { content: "package", isCorrect: true },
        ],
      },
      {
        content:
          'What is the output of: System.out.println(10 + 20 + "Hello");',
        difficulty: "Medium",
        choices: [
          { content: "1020Hello", isCorrect: false },
          { content: "30Hello", isCorrect: true },
          { content: "Hello30", isCorrect: false },
          { content: "Compilation Error", isCorrect: false },
        ],
      },
      {
        content: "Which method is used to start a thread in Java?",
        difficulty: "Medium",
        choices: [
          { content: "run()", isCorrect: false },
          { content: "start()", isCorrect: true },
          { content: "init()", isCorrect: false },
          { content: "resume()", isCorrect: false },
        ],
      },
      {
        content: "What is the purpose of the 'finally' block in Java?",
        difficulty: "Easy",
        choices: [
          {
            content: "To execute code only when an exception occurs",
            isCorrect: false,
          },
          {
            content:
              "To execute code regardless of whether an exception occurs",
            isCorrect: true,
          },
          { content: "To catch multiple exceptions", isCorrect: false },
          { content: "To throw exceptions", isCorrect: false },
        ],
      },
      {
        content: "Which collection class allows duplicate elements in Java?",
        difficulty: "Medium",
        choices: [
          { content: "HashSet", isCorrect: false },
          { content: "TreeSet", isCorrect: false },
          { content: "ArrayList", isCorrect: true },
          { content: "LinkedHashSet", isCorrect: false },
        ],
      },
      {
        content: "What is method overloading in Java?",
        difficulty: "Easy",
        choices: [
          {
            content:
              "Having multiple methods with same name but different parameters",
            isCorrect: true,
          },
          {
            content: "Having methods with same name in different classes",
            isCorrect: false,
          },
          { content: "Overriding parent class methods", isCorrect: false },
          { content: "Creating multiple constructors", isCorrect: false },
        ],
      },
      {
        content: "Which keyword is used to prevent method overriding in Java?",
        difficulty: "Medium",
        choices: [
          { content: "static", isCorrect: false },
          { content: "final", isCorrect: true },
          { content: "abstract", isCorrect: false },
          { content: "synchronized", isCorrect: false },
        ],
      },
      {
        content: "What is the default value of a boolean variable in Java?",
        difficulty: "Easy",
        choices: [
          { content: "true", isCorrect: false },
          { content: "false", isCorrect: true },
          { content: "0", isCorrect: false },
          { content: "null", isCorrect: false },
        ],
      },
    ];

    let createdCount = 0;

    for (const q of questions) {
      // Create question
      const question = await prisma.mcqQuestions.create({
        data: {
          Content: q.content,
          AssignmentId: assignment.Id,
          Difficulty: q.difficulty,
          ParamA: 1.0,
          ParamB: 0.5,
          ParamC: 0.25,
        },
      });

      // Create choices
      for (const c of q.choices) {
        await prisma.mcqChoices.create({
          data: {
            Content: c.content,
            IsCorrect: c.isCorrect,
            McqQuestionId: question.Id,
          },
        });
      }

      createdCount++;
      console.log(
        `✅ Created question ${createdCount}: ${q.content.substring(0, 50)}...`,
      );
    }

    // Update question count in assignment
    await prisma.assignments.update({
      where: { Id: assignment.Id },
      data: { QuestionCount: createdCount },
    });

    console.log(`\n🎉 Successfully created ${createdCount} MCQ questions!`);
    console.log(`   Updated assignment question count.`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addJavaMCQ();
