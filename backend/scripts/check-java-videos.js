import prisma from "../src/lib/prisma.js";

/**
 * Script to check current videos in Java course
 */

async function checkJavaVideos() {
  try {
    console.log("🔍 Checking Java course videos...\n");

    const javaCourse = await prisma.courses.findFirst({
      where: {
        Title: {
          contains: "Java",
          mode: "insensitive",
        },
      },
      include: {
        Sections: {
          include: {
            Lectures: {
              include: {
                LectureMaterial: {
                  where: {
                    Type: "video",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!javaCourse) {
      console.log("❌ Java course not found");
      return;
    }

    console.log(`📚 Course: ${javaCourse.Title}`);
    console.log(`📝 Course ID: ${javaCourse.Id}\n`);

    let totalVideos = 0;
    javaCourse.Sections.forEach((section) => {
      console.log(`\n📂 Section: ${section.Title}`);
      section.Lectures.forEach((lecture) => {
        console.log(`  📹 Lecture: ${lecture.Title}`);
        lecture.LectureMaterial.forEach((material) => {
          totalVideos++;
          console.log(`     Video: ${material.Url}`);
          console.log(`     Duration: ${material.Duration || "N/A"}`);
        });
      });
    });

    console.log(`\n✅ Total videos: ${totalVideos}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJavaVideos();
