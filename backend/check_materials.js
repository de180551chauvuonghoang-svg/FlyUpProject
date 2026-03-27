import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const lectureId = '37bf24ab-a5a8-48d6-a6e9-6fba29c25580'
  const materials = await prisma.lectureMaterial.findMany({
    where: { LectureId: lectureId }
  })
  
  console.log(`Materials for lecture ${lectureId}:`)
  materials.forEach(m => {
    console.log(`- ID: ${m.Id}, Type: ${m.Type}, URL: ${m.Url}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
