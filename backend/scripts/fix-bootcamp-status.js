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
  console.log("🔧 Fixing Bootcamp Course Status...\n");

  // Import prisma after dotenv is configured
  const { default: prisma } = await import("../src/lib/prisma.js");

  const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580"; // Linux Bootcamp

  // Check current status
  const course = await prisma.courses.findUnique({
    where: { Id: courseId },
    select: {
      Id: true,
      Title: true,
      Status: true,
      ApprovalStatus: true,
      LectureCount: true,
    },
  });

  if (!course) {
    console.log("❌ Course not found with ID:", courseId);
    console.log("   Please verify the course ID is correct.");
    return;
  }

  console.log("📋 Current Course Status:");
  console.log(`   Title: ${course.Title}`);
  console.log(`   Status: "${course.Status}"`);
  console.log(`   ApprovalStatus: "${course.ApprovalStatus}"`);
  console.log(`   LectureCount: ${course.LectureCount}`);

  // Check if already correct
  if (course.Status === "Ongoing" && course.ApprovalStatus === "APPROVED") {
    console.log("\n✅ Course status is already correct! No changes needed.");
    console.log("   If you still can't load the course, please check:");
    console.log("   1. User enrollment status");
    console.log("   2. Backend server is running");
    console.log("   3. Database connection");
    return;
  }

  console.log("\n⚠️  Status needs to be updated:");
  console.log(
    `   Current: Status="${course.Status}", ApprovalStatus="${course.ApprovalStatus}"`,
  );
  console.log(`   Required: Status="Ongoing", ApprovalStatus="APPROVED"`);

  // Update to correct values
  const updated = await prisma.courses.update({
    where: { Id: courseId },
    data: {
      Status: "Ongoing",
      ApprovalStatus: "APPROVED",
    },
  });

  console.log("\n✅ Course status updated successfully!");
  console.log(`   New Status: "${updated.Status}"`);
  console.log(`   New ApprovalStatus: "${updated.ApprovalStatus}"`);
  console.log("\n🎉 The bootcamp course should now load correctly!");
  console.log("   Please refresh your browser to try again.");

  // Disconnect prisma
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  console.error("\nPossible solutions:");
  console.error("1. Make sure DATABASE_URL is set in backend/.env");
  console.error("2. Check that the database is accessible");
  console.error("3. Verify Supabase connection details");
  process.exit(1);
});
