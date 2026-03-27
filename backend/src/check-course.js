import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCourse() {
  const course = await prisma.courses.findFirst({
    where: { Title: 'Question Bank Test Course' },
    select: { Id: true, Title: true, Status: true, DismissReason: true, RejectionReason: true }
  });
  console.log(JSON.stringify(course, null, 2));
  await prisma.$disconnect();
}

checkCourse();
