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
  console.log("🔍 Checking Instructor Account...\n");

  // Import prisma after dotenv is configured
  const { default: prisma } = await import("../src/lib/prisma.js");

  const email = "nguyenbach18@gmail.com";

  const user = await prisma.users.findFirst({
    where: { Email: email },
    select: {
      Id: true,
      FullName: true,
      Email: true,
      Role: true,
      AvatarUrl: true,
      Instructors_Instructors_CreatorIdToUsers: {
        select: {
          Id: true,
          Intro: true,
          Experience: true,
          Courses: {
            select: {
              Id: true,
              Title: true,
              Status: true,
              ApprovalStatus: true,
              LearnerCount: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    console.log("❌ User not found with email:", email);
    return;
  }

  console.log("👤 User Account Information:");
  console.log(`   User ID: ${user.Id}`);
  console.log(`   Full Name: ${user.FullName}`);
  console.log(`   Email: ${user.Email}`);
  console.log(`   Role: ${user.Role}`);

  if (user.Instructors_Instructors_CreatorIdToUsers.length > 0) {
    const instructor = user.Instructors_Instructors_CreatorIdToUsers[0];
    console.log("\n👨‍🏫 Instructor Profile:");
    console.log(`   Instructor ID: ${instructor.Id}`);
    console.log(`   Intro: ${instructor.Intro || "N/A"}`);
    console.log(`   Experience: ${instructor.Experience || "N/A"}`);
    console.log(`   Total Courses: ${instructor.Courses.length}`);

    if (instructor.Courses.length > 0) {
      console.log("\n📚 Courses:");
      instructor.Courses.forEach((course, idx) => {
        console.log(`   ${idx + 1}. ${course.Title}`);
        console.log(`      - ID: ${course.Id}`);
        console.log(`      - Status: ${course.Status}`);
        console.log(`      - Approval: ${course.ApprovalStatus}`);
        console.log(`      - Learners: ${course.LearnerCount}`);
      });
    }
  }

  console.log("\n🔑 Password Reset Options:");
  console.log("   1. Use 'Forgot Password' feature in the app");
  console.log("   2. Admin can manually reset password");
  console.log("   3. Check if you can login with Google/GitHub OAuth");
  console.log("\n💡 Alternative Solutions:");
  console.log("   1. Create a new admin/instructor account");
  console.log("   2. Transfer course ownership to new account");
  console.log("   3. Update course CreatorId in database (manual)");

  // Disconnect prisma
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
