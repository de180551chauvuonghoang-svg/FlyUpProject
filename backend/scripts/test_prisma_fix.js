import prisma from "../src/lib/prisma.js";

async function testFix() {
  const courseId = "69746c85-6109-4370-9334-1490cd2334b0";
  try {
    console.log(`[Test] Fetching assignments for course: ${courseId}`);
    const assignments = await prisma.assignments.findMany({
      where: {
        CourseId: courseId
      }
    });
    console.log(`[Success] Found ${assignments.length} assignments`);
    process.exit(0);
  } catch (error) {
    console.error("[Error] Failed to fetch assignments:", error);
    process.exit(1);
  }
}

testFix();
