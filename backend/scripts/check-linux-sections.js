import dotenv from 'dotenv';
dotenv.config();
import prisma from "../src/lib/prisma.js";

async function main() {
  const courseId = '37bf24ab-a5a8-48d6-a6e9-6fba29c25580';
  
  const assignments = await prisma.assignments.findMany({
    where: {
      Sections: { CourseId: courseId }
    },
    select: {
      Id: true,
      Name: true,
      SectionId: true,
      QuestionCount: true,
      Sections: { select: { Title: true, Index: true } },
      _count: { select: { McqQuestions: true } }
    }
  });

  // Sort by section index
  assignments.sort((a, b) => (a.Sections?.Index ?? 0) - (b.Sections?.Index ?? 0));

  console.log(`Found ${assignments.length} assignments:\n`);
  assignments.forEach(a => {
    console.log(`Section ${a.Sections?.Index}: "${a.Sections?.Title}"`);
    console.log(`  Assignment: "${a.Name}" (ID: ${a.Id})`);
    console.log(`  SectionId: ${a.SectionId}`);
    console.log(`  Questions: ${a._count.McqQuestions}\n`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
