import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const banks = await prisma.questionBanks.findMany({
    where: { Name: { contains: 'Linux', mode: 'insensitive' } },
    include: {
      _count: {
        select: { QuestionBankQuestions: true }
      }
    }
  })
  
  console.log(`Found ${banks.length} Linux-related Question Banks:`)
  banks.forEach(b => {
    console.log(`- ${b.Name} (ID: ${b.Id}), CourseId: ${b.CourseId}, Questions: ${b._count.QuestionBankQuestions}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
