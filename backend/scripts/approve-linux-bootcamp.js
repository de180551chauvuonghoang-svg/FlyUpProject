import prisma from "../src/lib/prisma.js";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- Updating Linux Bootcamp Status ---\n");

  const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580";

  // Check current status
  const course = await prisma.courses.findUnique({
    where: { Id: courseId },
    select: {
      Title: true,
      Status: true,
      ApprovalStatus: true,
      LectureCount: true,
    },
  });

  if (!course) {
    console.log("❌ Course not found!");
    return;
  }

  console.log("Current course status:");
  console.log(`  Title: ${course.Title}`);
  console.log(`  Status: ${course.Status}`);
  console.log(`  ApprovalStatus: ${course.ApprovalStatus}`);
  console.log(`  LectureCount: ${course.LectureCount}\n`);

  // Update to approved and published
  const updated = await prisma.courses.update({
    where: { Id: courseId },
    data: {
      Status: "Ongoing",
      ApprovalStatus: "APPROVED",
    },
  });

  console.log("✅ Course updated successfully!");
  console.log(`  New Status: ${updated.Status}`);
  console.log(`  New ApprovalStatus: ${updated.ApprovalStatus}`);
  console.log("\n🎉 Linux Bootcamp is now live and ready for learning!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
