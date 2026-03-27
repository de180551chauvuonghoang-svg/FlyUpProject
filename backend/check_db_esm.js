import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const mcqCount = await prisma.mcqQuestions.count()
    const qbCount = await prisma.questionBankQuestions.count()
    const assignmentCount = await prisma.assignments.count()
    
    console.log(`Total Assignments: ${assignmentCount}`)
    console.log(`Total MCQ Questions (Assignments): ${mcqCount}`)
    console.log(`Total QB Questions: ${qbCount}`)
    
    const mcqQuestions = await prisma.mcqQuestions.findMany({
      take: 5,
      include: {
        Assignments: {
          select: {
            Id: true,
            Name: true,
            SectionId: true
          }
        }
      }
    })
    
    console.log('Sample Questions:')
    mcqQuestions.forEach(q => {
      console.log(`- ID: ${q.Id}, Assignment: ${q.Assignments?.Name}, SectionId: ${q.Assignments?.SectionId}`)
    })

  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
