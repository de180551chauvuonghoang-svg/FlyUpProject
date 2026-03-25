import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST
dotenv.config({ path: join(__dirname, "../.env") });

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("🔍 Checking Bootcamp Course Instructor...\n");

  // Import prisma after dotenv is configured
  const { default: prisma } = await import("../src/lib/prisma.js");

  const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580"; // Linux Bootcamp

  const course = await prisma.courses.findUnique({
    where: { Id: courseId },
    select: {
      Id: true,
      Title: true,
      Status: true,
      ApprovalStatus: true,
      InstructorId: true,
      CreatorId: true,
      Instructors: {
        select: {
          Id: true,
          CreatorId: true,
          Users_Instructors_CreatorIdToUsers: {
            select: {
              Id: true,
              FullName: true,
              Email: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    console.log("❌ Course not found!");
    return;
  }

  console.log("📋 Course Information:");
  console.log(`   Title: ${course.Title}`);
  console.log(`   Course ID: ${course.Id}`);
  console.log(`   Status: ${course.Status}`);
  console.log(`   ApprovalStatus: ${course.ApprovalStatus}`);

  console.log("\n👨‍🏫 Instructor Information:");
  console.log(`   Instructor ID: ${course.InstructorId}`);
  console.log(`   Creator ID: ${course.CreatorId}`);

  if (course.Instructors) {
    console.log(
      `   Instructor Name: ${course.Instructors.Users_Instructors_CreatorIdToUsers.FullName}`,
    );
    console.log(
      `   Instructor Email: ${course.Instructors.Users_Instructors_CreatorIdToUsers.Email}`,
    );
  }

  console.log("\n✅ Update Permission:");
  console.log("   Instructor CAN update this course if:");
  console.log(
    `   1. User is logged in as: ${course.Instructors?.Users_Instructors_CreatorIdToUsers.Email}`,
  );
  console.log(`   2. Or User ID matches: ${course.CreatorId}`);
  console.log("   3. User has valid JWT token");

  console.log("\n📝 How to Update:");
  console.log("   1. Login as the instructor");
  console.log("   2. Navigate to instructor dashboard");
  console.log("   3. Find and edit this course");
  console.log("   4. Or use API: PUT /api/courses/" + courseId);

  // Disconnect prisma
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
