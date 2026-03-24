import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const banks = await prisma.questionBanks.findMany({
    include: {
      QuestionBankQuestions: {
        select: { Id: true }
      }
    }
  })
  
  console.log(`Total Question Banks found: ${banks.length}`)
  banks.forEach(b => {
    console.log(`- Bank: ${b.Name} (ID: ${b.Id}), CourseId: ${b.CourseId}, Questions: ${b.QuestionBankQuestions.length}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
