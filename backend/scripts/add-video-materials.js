import prisma from "../src/lib/prisma.js";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- Checking and Adding Video Materials to Java Lectures ---\n");

  // Find Java course with sections and lectures
  const javaCourse = await prisma.courses.findFirst({
    where: {
      Title: { contains: "Java" },
    },
    include: {
      Sections: {
        include: {
          Lectures: true,
        },
        orderBy: { CreationTime: "asc" },
      },
    },
  });

  if (!javaCourse) {
    console.log("❌ Java course not found!");
    return;
  }

  console.log(`📚 Found course: ${javaCourse.Title}\n`);

  // Mock video URLs for each lecture
  const mockVideoUrls = [
    "https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4",
  ];

  let videoIndex = 0;
  let materialCount = 0;

  for (const section of javaCourse.Sections || []) {
    for (const lecture of section.Lectures || []) {
      // Check if lecture already has video material
      const existingMaterial = await prisma.lectureMaterial.findFirst({
        where: {
          LectureId: lecture.Id,
          Type: "video",
        },
      });

      if (!existingMaterial) {
        // Add video material
        const videoUrl = mockVideoUrls[videoIndex % mockVideoUrls.length];

        const material = await prisma.lectureMaterial.create({
          data: {
            LectureId: lecture.Id,
            Type: "video",
            Url: videoUrl,
          },
        });

        console.log(`✓ Added video to: ${section.Title} > ${lecture.Title}`);
        console.log(`  URL: ${videoUrl.substring(0, 60)}...`);
        materialCount++;
        videoIndex++;
      } else {
        console.log(
          `- Video already exists: ${section.Title} > ${lecture.Title}`,
        );
      }
    }
  }

  console.log(`\n✅ Total videos added: ${materialCount}`);
  console.log(`📹 Videos are now available in the learning platform!`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
