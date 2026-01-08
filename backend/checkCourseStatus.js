import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCourseStatuses() {
  try {
    // Get all unique ApprovalStatus values
    const approvalStatuses = await prisma.courses.findMany({
      select: {
        ApprovalStatus: true
      },
      distinct: ['ApprovalStatus']
    });
    // llllll

    console.log('\n=== APPROVAL STATUSES IN DATABASE ===');
    console.log(approvalStatuses.map(c => c.ApprovalStatus));

    // Get all unique Status values
    const statuses = await prisma.courses.findMany({
      select: {
        Status: true
      },
      distinct: ['Status']
    });

    console.log('\n=== STATUSES IN DATABASE ===');
    console.log(statuses.map(c => c.Status));

    // Count courses by status combination
    const allCourses = await prisma.courses.groupBy({
      by: ['ApprovalStatus', 'Status'],
      _count: {
        Id: true
      }
    });

    console.log('\n=== COURSE COUNTS BY STATUS ===');
    allCourses.forEach(group => {
      console.log(`ApprovalStatus: "${group.ApprovalStatus}", Status: "${group.Status}", Count: ${group._count.Id}`);
    });

    // Total courses
    const total = await prisma.courses.count();
    console.log(`\n=== TOTAL COURSES: ${total} ===\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourseStatuses();
