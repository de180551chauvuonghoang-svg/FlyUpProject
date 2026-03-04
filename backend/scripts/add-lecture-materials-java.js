import prisma from "../src/lib/prisma.js";

/**
 * Script để thêm Lecture Materials cho khóa Java Course
 * Thêm videos, PDFs và documents cho các bài giảng
 */

async function addJavaCourseMaterials() {
  try {
    console.log("🚀 Starting to add lecture materials for Java Course...\n");

    // Tìm khóa Java Course
    const javaCourse = await prisma.courses.findFirst({
      where: {
        OR: [
          { Title: { contains: "Java", mode: "insensitive" } },
          { Title: { contains: "java", mode: "insensitive" } },
        ],
      },
      include: {
        Sections: {
          include: {
            Lectures: true,
          },
        },
      },
    });

    if (!javaCourse) {
      console.log("❌ Java Course not found!");
      return;
    }

    console.log(`✅ Found course: ${javaCourse.Title}`);
    console.log(`   Course ID: ${javaCourse.Id}`);
    console.log(`   Sections: ${javaCourse.Sections.length}\n`);

    // Sample materials URLs
    const sampleMaterials = {
      videos: [
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      ],
      pdfs: {
        // Từ Supabase của bạn
        IRJET:
          "https://wmiyvccxnlsylyweuiihf.supabase.co/storage/v1/object/public/course-materials/IRJET-V8I12211.pdf",
        Data: "https://wmiyvccxnlsylyweuiihf.supabase.co/storage/v1/object/public/course-materials/Data.docx",
      },
    };

    let materialCount = 0;

    // Duyệt qua từng section và lecture
    for (const section of javaCourse.Sections) {
      console.log(`\n📂 Section: ${section.Title}`);

      for (let i = 0; i < section.Lectures.length; i++) {
        const lecture = section.Lectures[i];
        console.log(`   📝 Lecture: ${lecture.Title}`);

        // Kiểm tra xem lecture đã có materials chưa
        const existingMaterials = await prisma.lectureMaterial.findMany({
          where: { LectureId: lecture.Id },
        });

        if (existingMaterials.length > 0) {
          console.log(
            `      ⏭️  Already has ${existingMaterials.length} material(s), skipping...`,
          );
          continue;
        }

        try {
          // Thêm video material
          const videoIndex = i % sampleMaterials.videos.length;
          await prisma.lectureMaterial.create({
            data: {
              LectureId: lecture.Id,
              Type: "video",
              Url: sampleMaterials.videos[videoIndex],
            },
          });
          materialCount++;
          console.log(`      ✅ Added video material`);

          // Thêm PDF material cho một số lectures
          if (i % 2 === 0) {
            const pdfKey = i % 2 === 0 ? "IRJET" : "Data";
            const pdfUrl = sampleMaterials.pdfs[pdfKey];
            const pdfType = pdfKey === "IRJET" ? "pdf" : "docx";

            await prisma.lectureMaterial.create({
              data: {
                LectureId: lecture.Id,
                Type: pdfType,
                Url: pdfUrl,
              },
            });
            materialCount++;
            console.log(`      ✅ Added ${pdfType.toUpperCase()} document`);
          }

          // Thêm delay nhỏ để tránh quá tải
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.log(`      ❌ Error adding materials: ${error.message}`);
        }
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Successfully added ${materialCount} materials!`);
    console.log("=".repeat(50));
    console.log("\n📚 Next steps:");
    console.log("1. Open the app and login as a student");
    console.log("2. Enroll in the Java Course (if not already enrolled)");
    console.log('3. Go to "My Learning" and open the Java Course');
    console.log("4. Select any lecture to view the materials");
    console.log('5. Check the "Resources" tab to see all files\n');
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
addJavaCourseMaterials()
  .then(() => {
    console.log("✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
