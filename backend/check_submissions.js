import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const submissions = await prisma.submissions.findMany({
    take: 10,
    orderBy: { CreationTime: 'desc' },
    include: {
      McqUserAnswer: {
        include: {
          McqChoices: {
            include: { McqQuestions: true }
          }
        }
      }
    }
  })
  
  console.log(`Last 10 submissions:`)
  submissions.forEach(s => {
    console.log(`- Date: ${s.CreationTime}, AssignmentId: ${s.AssignmentId}, Mark: ${s.Mark}`)
    s.McqUserAnswer.forEach(a => {
        console.log(`  * Question: ${a.McqChoices.McqQuestions?.Content}`)
    })
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
