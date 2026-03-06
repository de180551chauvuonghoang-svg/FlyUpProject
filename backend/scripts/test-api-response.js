import prisma from "../src/lib/prisma.js";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  console.log("--- Testing API Response for Java Course ---\n");

  const courseId = "00ef965c-d74e-487b-ab36-55619d89ef37";

  const course = await prisma.courses.findFirst({
    where: {
      Id: courseId,
      ApprovalStatus: "APPROVED",
      Status: "Ongoing",
    },
    select: {
      Id: true,
      Title: true,
      Sections: {
        select: {
          Id: true,
          Title: true,
          CreationTime: true,
          Lectures: {
            select: {
              Id: true,
              Title: true,
              Content: true,
              IsPreviewable: true,
              LectureMaterial: {
                select: {
                  Type: true,
                  Url: true,
                },
              },
            },
            orderBy: {
              CreationTime: "asc",
            },
          },
        },
        orderBy: {
          CreationTime: "asc",
        },
      },
    },
  });

  if (!course) {
    console.log("❌ Course not found!");
    return;
  }

  console.log("✓ Course found!");
  console.log(`\nTitle: ${course.Title}`);
  console.log(`Sections: ${course.Sections.length}\n`);

  course.Sections.forEach((section, sIdx) => {
    console.log(`📑 Section ${sIdx + 1}: ${section.Title}`);
    console.log(`   Lectures: ${section.Lectures.length}`);

    section.Lectures.forEach((lecture, lIdx) => {
      console.log(`   └─ ${lIdx + 1}. ${lecture.Title}`);
      console.log(`      Content: ${lecture.Content.substring(0, 40)}...`);
      console.log(`      Materials: ${lecture.LectureMaterial.length}`);

      if (lecture.LectureMaterial.length > 0) {
        lecture.LectureMaterial.forEach((mat) => {
          console.log(`        • ${mat.Type}: ${mat.Url.substring(0, 50)}...`);
        });
      }
    });
  });
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
