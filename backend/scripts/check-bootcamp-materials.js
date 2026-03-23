import prisma from "../src/lib/prisma.js";

async function checkBootcampMaterials() {
  try {
    const courseId = "37bf24ab-a5a8-48d6-a6e9-6fba29c25580";

    // Get course with sections and lectures
    const course = await prisma.courses.findUnique({
      where: { Id: courseId },
      include: {
        Sections: {
          include: {
            Lectures: {
              include: {
                LectureMaterial: true,
              },
            },
          },
          orderBy: { CreationTime: "asc" },
        },
      },
    });

    if (!course) {
      console.log("❌ Course not found");
      return;
    }

    console.log("✅ Course found:", course.Title);
    console.log("📚 Total Sections:", course.Sections.length);

    let totalLectures = 0;
    let totalVideos = 0;
    let totalMaterials = 0;

    course.Sections.forEach((section) => {
      console.log(`\n📦 Section: ${section.Title}`);
      console.log(`   Lectures: ${section.Lectures.length}`);

      section.Lectures.forEach((lecture) => {
        totalLectures++;
        const materials = lecture.LectureMaterial || [];
        const videos = materials.filter(
          (m) => m.Type.toLowerCase() === "video",
        );
        const docs = materials.filter((m) => m.Type.toLowerCase() !== "video");

        if (materials.length > 0) {
          console.log(`   📝 Lecture: ${lecture.Title}`);
          console.log(
            `      Materials: ${materials.length} (Videos: ${videos.length}, Docs: ${docs.length})`,
          );

          materials.forEach((m) => {
            console.log(`      - [${m.Type}] ${m.Url.substring(0, 80)}...`);
          });
        }

        totalVideos += videos.length;
        totalMaterials += docs.length;
      });
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total Lectures: ${totalLectures}`);
    console.log(`   Total Videos: ${totalVideos}`);
    console.log(`   Total Documents: ${totalMaterials}`);

    // Now check what API returns
    console.log("\n🔍 Checking transformed data (as API returns)...\n");

    const transformedSections = course.Sections.map((section) => {
      return {
        ...section,
        Lectures: section.Lectures.map((lecture) => {
          const materials = lecture.LectureMaterial || [];
          const videoMaterial = materials.find(
            (m) => m.Type.toLowerCase() === "video",
          );
          const documentMaterials = materials.filter(
            (m) => m.Type.toLowerCase() !== "video",
          );

          return {
            Id: lecture.Id,
            Title: lecture.Title,
            VideoUrl: videoMaterial?.Url || null,
            Materials: documentMaterials.map((m) => ({
              Id: m.Id,
              Type: m.Type,
              Url: m.Url,
              Name: m.Type + " Material",
            })),
          };
        }),
      };
    });

    transformedSections.forEach((section) => {
      console.log(`📦 ${section.Title}`);
      section.Lectures.forEach((lecture) => {
        console.log(`   📝 ${lecture.Title}`);
        console.log(`      VideoUrl: ${lecture.VideoUrl ? "✅ YES" : "❌ NO"}`);
        console.log(`      Materials: ${lecture.Materials.length}`);
      });
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkBootcampMaterials();
