import prisma from "../src/lib/prisma.js";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- All Users in Database ---");
  const users = await prisma.users.findMany({
    select: { Id: true, Email: true, FullName: true, Role: true },
  });
  console.log(`Total users: ${users.length}`);

  if (users.length === 0) {
    console.log("❌ No users found! You need to register first.");
  } else {
    users.forEach((u) => {
      console.log(`  ✓ ${u.Email} | ${u.FullName} | Role: ${u.Role}`);
    });
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
