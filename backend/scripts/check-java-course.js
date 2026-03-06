import prisma from "../src/lib/prisma.js";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- Checking Java Courses ---\n");

  // Find Java courses
  const courses = await prisma.courses.findMany({
    where: {
      OR: [{ Title: { contains: "Java" } }, { Title: { contains: "java" } }],
    },
    include: {
      Sections: {
        include: {
          Lectures: {
            orderBy: { CreationTime: "asc" },
          },
        },
        orderBy: { CreationTime: "asc" },
      },
      Instructors: {
        include: {
          Users_Instructors_CreatorIdToUsers: {
            select: {
              FullName: true,
              Email: true,
            },
          },
        },
      },
    },
  });

  if (courses.length === 0) {
    console.log("❌ No Java courses found!");
    console.log("\nLet me check all courses...\n");

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
      take: 10,
    });

    console.log(`Found ${allCourses.length} courses:`);
    allCourses.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.Title} (${c._count.Sections} sections)`);
    });
  } else {
    courses.forEach((course, idx) => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📚 Course ${idx + 1}: ${course.Title}`);
      console.log(`${"=".repeat(60)}`);
      console.log(`ID: ${course.Id}`);
      console.log(
        `Instructor: ${course.Instructors?.Users_Instructors_CreatorIdToUsers?.FullName || "N/A"}`,
      );
      console.log(`Price: ${course.Price} VND`);
      console.log(`Status: ${course.IsPublish ? "Published" : "Draft"}`);
      console.log(`\n📑 Sections (${course.Sections?.length || 0}):\n`);

      if (course.Sections && course.Sections.length > 0) {
        course.Sections.forEach((section, sIdx) => {
          console.log(`  Section ${sIdx + 1}: ${section.Title}`);
          console.log(`  └── Lectures (${section.Lectures?.length || 0}):`);

          if (section.Lectures && section.Lectures.length > 0) {
            section.Lectures.forEach((lecture, lIdx) => {
              const duration = lecture.Duration
                ? `${lecture.Duration} min`
                : "N/A";
              console.log(`      ${lIdx + 1}. ${lecture.Title} (${duration})`);
              if (lecture.Content) {
                const preview = lecture.Content.substring(0, 80);
                console.log(`         Content: ${preview}...`);
              }
            });
          } else {
            console.log(`      (No lectures)`);
          }
          console.log();
        });
      } else {
        console.log(`  (No sections)`);
      }
    });
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
