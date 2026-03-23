import prisma from "../src/lib/prisma.js";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- Checking Bootcamp Course Status ---\n");

  const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580"; // Linux Bootcamp

  const course = await prisma.courses.findUnique({
    where: { Id: courseId },
    select: {
      Id: true,
      Title: true,
      Status: true,
      ApprovalStatus: true,
      LectureCount: true,
      CreationTime: true,
    },
  });

  if (!course) {
    console.log("❌ Course not found with ID:", courseId);
    return;
  }

  console.log("📋 Course Details:");
  console.log(`  Title: ${course.Title}`);
  console.log(`  Status: "${course.Status}"`);
  console.log(`  ApprovalStatus: "${course.ApprovalStatus}"`);
  console.log(`  LectureCount: ${course.LectureCount}`);
  console.log(`  CreationTime: ${course.CreationTime}`);

  console.log("\n🔍 What the API expects:");
  console.log(`  Status: "Ongoing"`);
  console.log(`  ApprovalStatus: "APPROVED"`);

  console.log("\n📊 Status Comparison:");
  const statusMatch = course.Status === "Ongoing";
  const approvalMatch = course.ApprovalStatus === "APPROVED";

  console.log(
    `  Status match: ${statusMatch ? "✅" : "❌"} (Current: "${course.Status}", Expected: "Ongoing")`,
  );
  console.log(
    `  Approval match: ${approvalMatch ? "✅" : "❌"} (Current: "${course.ApprovalStatus}", Expected: "APPROVED")`,
  );

  if (!statusMatch || !approvalMatch) {
    console.log("\n⚠️  Course status doesn't match API expectations!");
    console.log("   This is why the course cannot be loaded.");
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
