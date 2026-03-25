import prisma from "../src/lib/prisma.js";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- Checking for Linux Bootcamp Course ---\n");

  // Check if Linux Administration Bootcamp course exists
  const linuxCourse = await prisma.courses.findFirst({
    where: {
      Title: { contains: "Linux Administration Bootcamp" },
    },
    include: {
      Sections: {
        include: {
          Lectures: {
            include: {
              LectureMaterial: true,
            },
          },
        },
        orderBy: { Index: "asc" },
      },
    },
  });

  if (!linuxCourse) {
    console.log("❌ Linux Administration Bootcamp course NOT found!");
    console.log("\nListing all courses:");
    
    const allCourses = await prisma.courses.findMany({
      select: {
        Id: true,
        Title: true,
        _count: {
          select: {
            Sections: true,
          },
        },
      },
    });
    
    allCourses.forEach((course) => {
      console.log(`- ${course.Title} (${course._count.Sections} sections)`);
    });
    
    return;
  }

  console.log(`✅ Found course: ${linuxCourse.Title}`);
  console.log(`Course ID: ${linuxCourse.Id}`);
  console.log(`Sections: ${linuxCourse.Sections?.length || 0}`);
  
  let totalLectures = 0;
  let totalMaterials = 0;

  linuxCourse.Sections?.forEach((section) => {
    console.log(`\n📂 Section ${section.Index}: ${section.Title}`);
    console.log(`   Lectures: ${section.Lectures?.length || 0}`);
    
    section.Lectures?.forEach((lecture) => {
      totalLectures++;
      const materialCount = lecture.LectureMaterial?.length || 0;
      totalMaterials += materialCount;
      console.log(`   - ${lecture.Title} (${materialCount} materials)`);
    });
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total Sections: ${linuxCourse.Sections?.length || 0}`);
  console.log(`   Total Lectures: ${totalLectures}`);
  console.log(`   Total Materials: ${totalMaterials}`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
