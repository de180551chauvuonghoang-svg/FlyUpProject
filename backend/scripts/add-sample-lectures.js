import prisma from "../src/lib/prisma.js";
import { v4 as uuidv4 } from "uuid";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

async function main() {
  const courseId = "00ef965c-d74e-487b-ab36-55619d89ef37";

  console.log("--- Adding Sample Lectures to Java Course ---");

  // Get all sections for this course
  const sections = await prisma.sections.findMany({
    where: { CourseId: courseId },
    orderBy: { Index: "asc" },
  });

  console.log(`Found ${sections.length} sections`);

  let totalCreated = 0;

  for (const section of sections) {
    console.log(
      `\nAdding lectures to section: ${section.Title} (ID: ${section.Id})`,
    );

    // Add 3 lectures per section
    const lectureCount = 3;
    for (let i = 1; i <= lectureCount; i++) {
      const lectureId = uuidv4();
      const lecture = await prisma.lectures.create({
        data: {
          Id: lectureId,
          Title: `${section.Title} - Lesson ${i}`,
          Content: `This is lesson ${i} content for ${section.Title}`,
          SectionId: section.Id,
          CreationTime: new Date(),
          LastModificationTime: new Date(),
          IsPreviewable: i === 1, // First lecture is previewable
        },
      });

      console.log(`  ✓ Created lecture: ${lecture.Title}`);
      totalCreated++;
    }
  }

  console.log(`\n✅ Successfully created ${totalCreated} sample lectures!`);

  // Verify
  console.log("\n--- Verification ---");
  const updatedCourse = await prisma.courses.findFirst({
    where: { Id: courseId },
    include: {
      Sections: {
        include: {
          Lectures: {
            select: { Id: true, Title: true },
          },
        },
      },
    },
  });

  if (updatedCourse) {
    console.log(`Course: ${updatedCourse.Title}`);
    updatedCourse.Sections.forEach((sec, i) => {
      console.log(
        `  Section ${i}: ${sec.Title} - ${sec.Lectures?.length || 0} lectures`,
      );
      sec.Lectures?.forEach((lec) => {
        console.log(`    - ${lec.Title}`);
      });
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
