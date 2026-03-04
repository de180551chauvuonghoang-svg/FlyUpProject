import prisma from "../src/lib/prisma.js";

/**
 * Script to update Java course with better free short videos
 * Using publicly available sample videos from various sources
 */

async function updateJavaVideos() {
  try {
    console.log("🎥 Updating Java course with new short videos...\n");

    // Video ngắn miễn phí từ nhiều nguồn công khai
    const shortVideoUrls = [
      // Video 5-30 giây từ nhiều nguồn
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // 15 seconds
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", // 15 seconds
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", // 15 seconds
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", // 15 seconds
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", // 15 seconds
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", // Short trailer
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    ];

    // Tìm Java course
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

    console.log(`📚 Course: ${javaCourse.Title}\n`);

    let videoIndex = 0;
    let updatedCount = 0;

    // Update từng video
    for (const section of javaCourse.Sections) {
      console.log(`📂 Section: ${section.Title}`);

      for (const lecture of section.Lectures) {
        for (const material of lecture.LectureMaterial) {
          const newUrl = shortVideoUrls[videoIndex % shortVideoUrls.length];

          console.log(`  📹 Lecture: ${lecture.Title}`);
          console.log(`     Old: ${material.Url.substring(0, 50)}...`);
          console.log(`     New: ${newUrl.substring(0, 50)}...`);

          await prisma.lectureMaterial.update({
            where: {
              LectureId_Id: {
                LectureId: material.LectureId,
                Id: material.Id,
              },
            },
            data: {
              Url: newUrl,
            },
          });

          updatedCount++;
          videoIndex++;
          console.log(`     ✅ Updated!\n`);
        }
      }
    }

    console.log(`\n✨ Successfully updated ${updatedCount} videos!`);
    console.log(
      "🎬 Videos are from Google Cloud Storage (public sample videos)",
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateJavaVideos();
