import prisma from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  const email = "logintest@example.com";
  const password = "Password123!";
  const fullName = "Login Test User";

  // Check if user already exists
  const existingUser = await prisma.users.findFirst({
    where: { Email: { equals: email.toLowerCase(), mode: "insensitive" } },
  });

  if (existingUser) {
    console.log(`✓ User ${email} already exists`);
    console.log(`  Try login with: email=${email}, password=${password}`);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const newUser = await prisma.users.create({
    data: {
      Id: uuidv4(),
      Email: email.toLowerCase(),
      FullName: fullName,
      MetaFullName: fullName.toLowerCase(),
      Password: hashedPassword,
      UserName: `testuser${Date.now()}`,
      Role: "learner",
      AvatarUrl: "",
      Bio: "",
      Token: "",
      RefreshToken: "",
      IsVerified: false,
      IsApproved: false,
      AccessFailedCount: 0,
      EnrollmentCount: 0,
      SystemBalance: BigInt(0),
      CreationTime: new Date(),
      LastModificationTime: new Date(),
    },
  });

  console.log("✅ Test user created successfully!");
  console.log(`\n📧 Email: ${email}`);
  console.log(`🔐 Password: ${password}`);
  console.log(`\nUse these credentials to login in the frontend.`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
