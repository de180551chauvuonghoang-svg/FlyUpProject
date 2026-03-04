import prisma from "../src/lib/prisma.js";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- Updating Java Course Status ---\n");

  // Find and update Java course
  const updated = await prisma.courses.update({
    where: {
      Id: "00ef965c-d74e-487b-ab36-55619d89ef37",
    },
    data: {
      Status: "Ongoing",
    },
    select: {
      Id: true,
      Title: true,
      Status: true,
      ApprovalStatus: true,
    },
  });

  console.log("✅ Updated Java Course:");
  console.log(`   ID: ${updated.Id}`);
  console.log(`   Title: ${updated.Title}`);
  console.log(`   Status: ${updated.Status}`);
  console.log(`   ApprovalStatus: ${updated.ApprovalStatus}`);
  console.log(`\n✓ Course is now accessible!`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
