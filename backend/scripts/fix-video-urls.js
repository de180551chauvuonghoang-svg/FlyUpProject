import prisma from "../src/lib/prisma.js";

/**
 * Script để sửa các video URLs không hoạt động
 * Thay thế bằng sample videos từ nguồn công khai
 */

async function fixVideoUrls() {
  try {
    console.log("🔧 Fixing broken video URLs...\n");

    // URLs mới từ nhiều nguồn công khai khác nhau
    const workingVideoUrls = [
      // Sample videos from file-examples.com
      "https://file-examples.com/storage/fe28ca11d66f0efa37c1e5d/2017/04/file_example_MP4_480_1_5MG.mp4",
      "https://file-examples.com/storage/fe28ca11d66f0efa37c1e5d/2017/04/file_example_MP4_640_3MG.mp4",
      "https://file-examples.com/storage/fe28ca11d66f0efa37c1e5d/2017/04/file_example_MP4_1280_10MG.mp4",
      // Sample videos from sample-videos.com
      "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4",
      "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_5mb.mp4",
      // Test videos from test-videos.co.uk
      "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
      "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4",
      // Sample from Wikimedia Commons
      "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.vp9.webm",
      // Fallback videos
      "https://www.w3schools.com/html/mov_bbb.mp4",
      "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4",
      "https://download.samplelib.com/mp4/sample-5s.mp4",
    ];

    // Tìm tất cả materials có type 'video' (update tất cả)
    const brokenMaterials = await prisma.lectureMaterial.findMany({
      where: {
        Type: "video",
      },
      include: {
        Lectures: {
          include: {
            Sections: true,
          },
        },
      },
    });

    console.log(
      `🔍 Found ${brokenMaterials.length} video materials to update\n`,
    );

    if (brokenMaterials.length === 0) {
      console.log("✅ No broken URLs found!");
      return;
    }

    let fixed = 0;

    // Update từng material
    for (let i = 0; i < brokenMaterials.length; i++) {
      const material = brokenMaterials[i];
      const newUrl = workingVideoUrls[i % workingVideoUrls.length];

      console.log(`📹 Lecture: ${material.Lectures.Title}`);
      console.log(
        `   Old URL: ${material.Url.length > 60 ? material.Url.substring(0, 60) + "..." : material.Url}`,
      );
      console.log(
        `   New URL: ${newUrl.length > 60 ? newUrl.substring(0, 60) + "..." : newUrl}`,
      );

      await prisma.lectureMaterial.update({
        where: {
          LectureId_Id: { LectureId: material.LectureId, Id: material.Id },
        },
        data: { Url: newUrl },
      });

      fixed++;
      console.log(`   ✅ Fixed!\n`);
    }

    console.log(`\n🎉 Successfully fixed ${fixed} video URLs!`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixVideoUrls();
