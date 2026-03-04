import dotenv from "dotenv";
import prisma from "../src/lib/prisma.js";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
dotenv.config();

async function setupInstructor() {
  console.log("🔍 Checking instructor accounts...\n");

  try {
    // Get all instructor users without instructor record
    const instructors = await prisma.users.findMany({
      where: {
        Role: "instructor",
      },
      select: {
        Id: true,
        Email: true,
        FullName: true,
      },
    });

    console.log(`📊 Found ${instructors.length} instructor user(s):\n`);
    instructors.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.FullName} (${user.Email})`);
    });

    if (instructors.length === 0) {
      console.log("❌ No instructor users found!");
      return;
    }

    console.log("\n🔎 Checking instructor records...\n");

    // Check which ones have instructor record
    for (const user of instructors) {
      const instructorRecord = await prisma.instructors.findFirst({
        where: { CreatorId: user.Id },
      });

      if (!instructorRecord) {
        console.log(
          `⚠️  ${user.FullName} (${user.Email}) - Missing instructor record`
        );

        // Create instructor record
        const newInstructor = await prisma.instructors.create({
          data: {
            Id: uuidv4(),
            CreatorId: user.Id,
            Intro: "",
            Experience: "",
            Balance: BigInt(0),
            CourseCount: 0,
          },
        });

        console.log(`✅ Created instructor record: ${newInstructor.Id}\n`);
      } else {
        console.log(
          `✅ ${user.FullName} (${user.Email}) - Already has instructor record: ${instructorRecord.Id}\n`
        );
      }
    }

    console.log("✨ Setup complete!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupInstructor();
