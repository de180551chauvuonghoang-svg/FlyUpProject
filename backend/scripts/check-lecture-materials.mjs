import prisma from "../src/lib/prisma.js";

async function checkMaterials() {
  try {
    const lecture = await prisma.lectures.findFirst({
      where: { Title: "The Linux Directory Structure" },
      include: {
        LectureMaterial: true,
        Sections: { select: { CourseId: true } },
      },
    });

    if (!lecture) {
      console.log("❌ LECTURE NOT FOUND");
      process.exit(1);
    }

    console.log("✅ LECTURE FOUND:", lecture.Title);
    console.log("📝 Lecture ID:", lecture.Id);
    console.log("📊 Materials in DB:", lecture.LectureMaterial.length);

    if (lecture.LectureMaterial.length === 0) {
      console.log("❌ NO MATERIALS FOUND IN DATABASE");
    } else {
      console.log("\n📋 Materials:");
      lecture.LectureMaterial.forEach((m, i) => {
        console.log(`  ${i + 1}. Type: ${m.Type}`);
        console.log(`     Id: ${m.Id}`);
        console.log(`     URL: ${m.Url.substring(0, 120)}...`);

        // Check if URL is Supabase or old link
        if (m.Url.includes("supabase")) {
          console.log(`     ✅ Supabase URL detected`);
        } else if (
          m.Url.includes("commondatastorage") ||
          m.Url.includes("gtv-videos")
        ) {
          console.log(`     ❌ Old/dead URL detected`);
        }
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
}

checkMaterials();
