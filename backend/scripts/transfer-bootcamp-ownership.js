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
  console.log("🔄 Transferring Bootcamp Course Ownership...\n");

  // Import prisma after dotenv is configured
  const { default: prisma } = await import("../src/lib/prisma.js");

  const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580"; // Linux Bootcamp
  const newOwnerEmail = "datdinh1006dn@gmail.com"; // zalohub (correct email with 'o')

  // Step 1: Find the new owner (zalohub)
  console.log("🔍 Step 1: Finding new owner account...");
  const newOwner = await prisma.users.findFirst({
    where: { Email: newOwnerEmail },
  });

  if (!newOwner) {
    console.log("❌ New owner user not found with email:", newOwnerEmail);
    console.log("   Please make sure the user has registered.");
    return;
  }

  console.log(`✅ Found user: ${newOwner.FullName} (${newOwner.Email})`);
  console.log(`   User ID: ${newOwner.Id}`);
  console.log(`   Role: ${newOwner.Role}`);

  // Step 2: Check if user is an instructor, if not create instructor profile
  console.log("\n🔍 Step 2: Checking instructor profile...");
  let instructor = await prisma.instructors.findFirst({
    where: { CreatorId: newOwner.Id },
  });

  if (!instructor) {
    console.log(
      "⚠️  User is not an instructor yet. Creating instructor profile...",
    );
    instructor = await prisma.instructors.create({
      data: {
        CreatorId: newOwner.Id,
        Intro: "Experienced instructor passionate about technology education",
        Experience: "Software development and teaching",
        Balance: 0,
        CourseCount: 0,
      },
    });

    // Update user role to instructor
    await prisma.users.update({
      where: { Id: newOwner.Id },
      data: {
        Role: "Instructor",
        InstructorId: instructor.Id,
      },
    });

    console.log(`✅ Created instructor profile: ${instructor.Id}`);
  } else {
    console.log(`✅ Instructor profile exists: ${instructor.Id}`);
  }

  // Step 3: Get current course info
  console.log("\n🔍 Step 3: Getting current course info...");
  const course = await prisma.courses.findUnique({
    where: { Id: courseId },
    select: {
      Id: true,
      Title: true,
      InstructorId: true,
      CreatorId: true,
      Status: true,
      ApprovalStatus: true,
    },
  });

  if (!course) {
    console.log("❌ Course not found!");
    return;
  }

  console.log(`📚 Course: ${course.Title}`);
  console.log(`   Current Instructor ID: ${course.InstructorId}`);
  console.log(`   Current Creator ID: ${course.CreatorId}`);

  // Step 4: Transfer ownership
  console.log("\n🔄 Step 4: Transferring course ownership...");
  const updated = await prisma.courses.update({
    where: { Id: courseId },
    data: {
      InstructorId: instructor.Id,
      CreatorId: newOwner.Id,
      LastModifierId: newOwner.Id,
    },
  });

  console.log("✅ Course ownership transferred successfully!");
  console.log(`   New Instructor ID: ${updated.InstructorId}`);
  console.log(`   New Creator ID: ${updated.CreatorId}`);

  // Step 5: Update instructor course count
  const courseCount = await prisma.courses.count({
    where: { InstructorId: instructor.Id },
  });

  await prisma.instructors.update({
    where: { Id: instructor.Id },
    data: { CourseCount: courseCount },
  });

  console.log("\n🎉 Success! You can now:");
  console.log(`   ✅ Login with: ${newOwnerEmail}`);
  console.log("   ✅ Access instructor dashboard");
  console.log("   ✅ Edit and update the bootcamp course");
  console.log("   ✅ View course statistics and learners");

  console.log("\n📝 Next Steps:");
  console.log("   1. Refresh your browser");
  console.log(
    "   2. Navigate to 'My Dashboard' (you should see Instructor option)",
  );
  console.log("   3. Find the bootcamp course in your courses list");
  console.log("   4. Click edit to update course content");

  // Disconnect prisma
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  console.error("\nDetails:", e);
  process.exit(1);
});
