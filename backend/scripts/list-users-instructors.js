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
  console.log("🔍 Listing Recent Users and Instructors...\n");

  // Import prisma after dotenv is configured
  const { default: prisma } = await import("../src/lib/prisma.js");

  // Get all users ordered by creation time
  console.log("📋 Recent Users (last 10):");
  const users = await prisma.users.findMany({
    orderBy: { CreationTime: "desc" },
    take: 10,
    select: {
      Id: true,
      FullName: true,
      Email: true,
      Role: true,
      CreationTime: true,
    },
  });

  users.forEach((user, idx) => {
    console.log(`\n${idx + 1}. ${user.FullName || "N/A"}`);
    console.log(`   Email: ${user.Email}`);
    console.log(`   User ID: ${user.Id}`);
    console.log(`   Role: ${user.Role}`);
    console.log(`   Created: ${user.CreationTime.toISOString()}`);
  });

  // Get all instructors
  console.log("\n\n👨‍🏫 All Instructors:");
  const instructors = await prisma.instructors.findMany({
    select: {
      Id: true,
      CreatorId: true,
      CourseCount: true,
      Users_Instructors_CreatorIdToUsers: {
        select: {
          FullName: true,
          Email: true,
        },
      },
      Courses: {
        select: {
          Title: true,
        },
      },
    },
  });

  instructors.forEach((instructor, idx) => {
    console.log(
      `\n${idx + 1}. ${instructor.Users_Instructors_CreatorIdToUsers.FullName}`,
    );
    console.log(
      `   Email: ${instructor.Users_Instructors_CreatorIdToUsers.Email}`,
    );
    console.log(`   Instructor ID: ${instructor.Id}`);
    console.log(`   Creator ID: ${instructor.CreatorId}`);
    console.log(`   Courses: ${instructor.CourseCount}`);
    if (instructor.Courses.length > 0) {
      instructor.Courses.forEach((course) => {
        console.log(`     - ${course.Title}`);
      });
    }
  });

  console.log("\n\n💡 Instructions:");
  console.log("1. Find your email in the list above");
  console.log(
    "2. If you see your account, I'll update the script with correct email",
  );
  console.log(
    "3. If not found, please double-check the email you used to register",
  );

  // Disconnect prisma
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
