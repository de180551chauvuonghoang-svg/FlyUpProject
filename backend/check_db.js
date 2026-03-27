const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
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
    
    console.log('Total MCQ Questions found:', await prisma.mcqQuestions.count())
    console.log('Sample Questions:')
    mcqQuestions.forEach(q => {
      console.log(`- ID: ${q.Id}, Assignment: ${q.Assignments?.Name}, SectionId: ${q.Assignments?.SectionId}`)
    })
    
    const allAssignments = await prisma.assignments.findMany({
        take: 5,
        select: { Id: true, Name: true, SectionId: true, QuestionCount: true }
    })
    console.log('Sample Assignments:')
    allAssignments.forEach(a => {
        console.log(`- ${a.Name} (${a.Id}) Section: ${a.SectionId}, Questions: ${a.QuestionCount}`)
    })

  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
