import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const courseId = '37bf24ab-a5a8-48d6-a6e9-6fba29c25580'
  const assignments = await prisma.assignments.findMany({
    where: {
      OR: [
        { CourseId: courseId },
        { Sections: { CourseId: courseId } }
      ]
    },
    include: {
      _count: {
        select: { McqQuestions: true }
      }
    }
  })
  
  console.log(`Assignments for course ${courseId}:`)
  assignments.forEach(a => {
    console.log(`- ${a.Name} (ID: ${a.Id}), SectionId: ${a.SectionId}, Questions: ${a._count.McqQuestions}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
