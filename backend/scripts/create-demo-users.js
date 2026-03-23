import prisma from "../src/lib/prisma.js";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const demoUsers = [
  {
    email: "student1@flyup.com",
    fullName: "Alice Johnson",
    password: "Demo123!",
  },
  {
    email: "student2@flyup.com",
    fullName: "Bob Smith",
    password: "Demo123!",
  },
  {
    email: "student3@flyup.com",
    fullName: "Carol Williams",
    password: "Demo123!",
  },
  {
    email: "learner1@flyup.com",
    fullName: "David Brown",
    password: "Demo123!",
  },
  {
    email: "learner2@flyup.com",
    fullName: "Emma Davis",
    password: "Demo123!",
  },
];

async function main() {
  console.log("--- Creating Demo Users ---\n");

  const createdUsers = [];

  for (const userData of demoUsers) {
    // Check if user exists
    const existingUser = await prisma.users.findFirst({
      where: { Email: userData.email },
    });

    if (existingUser) {
      console.log(`⚠️  User ${userData.email} already exists`);
      createdUsers.push(existingUser);
      continue;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const newUser = await prisma.users.create({
      data: {
        Id: uuidv4(),
        Email: userData.email,
        FullName: userData.fullName,
        MetaFullName: userData.fullName.toLowerCase(),
        Password: hashedPassword,
        UserName: userData.email.split("@")[0],
        Role: "learner",
        AvatarUrl: "",
        Bio: `I'm ${userData.fullName}, passionate about learning!`,
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

    console.log(`✓ Created user: ${newUser.FullName} (${newUser.Email})`);
    createdUsers.push(newUser);
  }

  console.log(`\n✅ Total users ready: ${createdUsers.length}`);
  console.log("\n📝 Login credentials (password same for all):");
  console.log("   Password: Demo123!\n");
  
  createdUsers.forEach((user) => {
    console.log(`   - ${user.Email}`);
  });

  return createdUsers;
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
