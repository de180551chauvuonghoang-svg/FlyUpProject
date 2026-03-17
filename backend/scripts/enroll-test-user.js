import prisma from "../src/lib/prisma.js";
import { v4 as uuidv4 } from "uuid";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- Enrolling Test User in Java Course ---\n");

  // Find Java course
  const javaCourse = await prisma.courses.findFirst({
    where: {
      Title: { contains: "Java" },
    },
    select: {
      Id: true,
      Title: true,
      Price: true,
    },
  });

  if (!javaCourse) {
    console.log("❌ No Java course found!");
    return;
  }

  console.log(`✓ Found course: ${javaCourse.Title} (ID: ${javaCourse.Id})\n`);

  // Find test user (any user)
  const testUser = await prisma.users.findFirst({
    select: {
      Id: true,
      Email: true,
      FullName: true,
      Role: true,
    },
  });

  if (!testUser) {
    console.log("❌ No users found! Please register a user first.");
    return;
  }

  console.log(
    `✓ Found user: ${testUser.FullName} (${testUser.Email}) - Role: ${testUser.Role || "none"}\n`,
  );

  // Check if already enrolled
  const existingEnrollment = await prisma.enrollments.findFirst({
    where: {
      CreatorId: testUser.Id,
      CourseId: javaCourse.Id,
    },
  });

  if (existingEnrollment) {
    console.log("✓ User is already enrolled in this course!");
    console.log(`   Progress: ${existingEnrollment.LectureMilestones || "[]"}`);
    return;
  }

  // Create enrollment
  const enrollment = await prisma.enrollments.create({
    data: {
      CreatorId: testUser.Id,
      CourseId: javaCourse.Id,
      LectureMilestones: "[]",
    },
  });

  console.log("✅ Successfully enrolled user in course!");
  console.log(`\n📚 Now you can access the course at:`);
  console.log(`   http://localhost:5173/course/${javaCourse.Id}\n`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
