const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const statuses = await prisma.courses.findMany({
      select: { Status: true },
      distinct: ['Status']
    });
    console.log('Statuses:', statuses);
    
    const course = await prisma.courses.findFirst({
      where: { Title: { contains: 'Question Bank' } },
      select: { Id: true, Title: true, Status: true, DismissReason: true }
    });
    console.log('Course:', course);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
