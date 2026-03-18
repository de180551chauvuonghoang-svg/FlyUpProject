import prisma from "../src/lib/prisma.js";
import { v4 as uuidv4 } from "uuid";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- Enrolling User in Linux Bootcamp ---\n");

  const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580";

  // Find or create a test user
  let user = await prisma.users.findFirst({
    where: {
      Email: "test@flyup.com",
    },
  });

  if (!user) {
    console.log("Test user not found, creating one...");
    user = await prisma.users.create({
      data: {
        Id: uuidv4(),
        UserName: "testuser",
        Email: "test@flyup.com",
        FullName: "Test User",
        MetaFullName: "test user",
        Password: "$2a$10$rRdYY8fZ2HxrEd0nLb3.xO7E8nH2C1q9WyH5KsWfOCqGvY6BQ9h3i", // password: test123
        Role: "learner",
        AvatarUrl: "",
        Bio: "",
        Token: "",
        RefreshToken: "",
        IsVerified: true,
        IsApproved: true,
        AccessFailedCount: 0,
        EnrollmentCount: 0,
        SystemBalance: BigInt(0),
        CreationTime: new Date(),
        LastModificationTime: new Date(),
      },
    });
    console.log(`✓ Created test user: ${user.Email}\n`);
  } else {
    console.log(`✓ Found existing user: ${user.Email}\n`);
  }

  // Check if already enrolled
  const existingEnrollment = await prisma.enrollments.findFirst({
    where: {
      CreatorId: user.Id,
      CourseId: courseId,
    },
  });

  if (existingEnrollment) {
    console.log("⚠️  User is already enrolled in this course!");
    console.log(`   Enrollment ID: ${existingEnrollment.CreatorId}`);
    console.log(`   Progress: ${existingEnrollment.LectureMilestones || "[]"}`);
    return;
  }

  // Enroll the user
  const enrollment = await prisma.enrollments.create({
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

  console.log("✅ User enrolled successfully!");
  console.log(`   User: ${user.FullName} (${user.Email})`);
  console.log(`   Course: Linux Administration Bootcamp`);
  console.log(`   Enrollment Creator ID: ${enrollment.CreatorId}`);
  
  // Update course learner count
  await prisma.courses.update({
    where: { Id: courseId },
    data: {
      LearnerCount: {
        increment: 1,
      },
    },
  });

  console.log("\n🎉 Ready to learn! You can now access the course on the learning page!");
  console.log("\n📝 Login credentials:");
  console.log("   Email: test@flyup.com");
  console.log("   Password: test123");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
