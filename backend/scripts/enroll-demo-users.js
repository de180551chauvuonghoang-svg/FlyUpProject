import prisma from "../src/lib/prisma.js";
import { v4 as uuidv4 } from "uuid";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- Enrolling Demo Users in Linux Bootcamp ---\n");

  const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580"; // Linux Bootcamp

  // Get all demo users
  const demoEmails = [
    "student1@flyup.com",
    "student2@flyup.com",
    "student3@flyup.com",
    "learner1@flyup.com",
    "learner2@flyup.com",
    "test@flyup.com", // Include the original test user too
  ];

  const users = await prisma.users.findMany({
    where: {
      Email: {
        in: demoEmails,
      },
    },
  });

  if (users.length === 0) {
    console.log("❌ No demo users found! Please run create-demo-users.js first.");
    return;
  }

  console.log(`Found ${users.length} users\n`);

  let enrolledCount = 0;
  let alreadyEnrolledCount = 0;

  for (const user of users) {
    // Check if already enrolled
    const existingEnrollment = await prisma.enrollments.findFirst({
      where: {
        CreatorId: user.Id,
        CourseId: courseId,
      },
    });

    if (existingEnrollment) {
      console.log(`⚠️  ${user.FullName} already enrolled`);
      alreadyEnrolledCount++;
      continue;
    }

    // Enroll the user
    await prisma.enrollments.create({
      data: {
        CreatorId: user.Id,
        CourseId: courseId,
        CreationTime: new Date(),
        LectureMilestones: "[]",
        SectionMilestones: "[]",
        AssignmentMilestones: "[]",
        Status: "active",
      },
    });

    // Update course learner count
    await prisma.courses.update({
      where: { Id: courseId },
      data: {
        LearnerCount: {
          increment: 1,
        },
      },
    });

    console.log(`✓ Enrolled: ${user.FullName} (${user.Email})`);
    enrolledCount++;
  }

  console.log(`\n📊 Summary:`);
  console.log(`   New enrollments: ${enrolledCount}`);
  console.log(`   Already enrolled: ${alreadyEnrolledCount}`);
  console.log(`   Total users processed: ${users.length}`);

  console.log("\n🎉 All demo users are now enrolled in Linux Bootcamp!");
  console.log("\n📝 You can login with any of these accounts:");
  console.log("   Password for all: Demo123! (or test123 for test@flyup.com)");
  demoEmails.forEach((email) => {
    console.log(`   - ${email}`);
  });
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
