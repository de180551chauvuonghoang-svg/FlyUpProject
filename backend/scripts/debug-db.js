
import prisma from '../src/lib/prisma.js';

BigInt.prototype.toJSON = function() { return this.toString() }

async function main() {
  console.log('--- Latest 5 Checkouts ---');
  const checkouts = await prisma.cartCheckout.findMany({
    take: 5,
    orderBy: { CreationTime: 'desc' },
    include: { Users: { select: { UserName: true, Email: true } } }
  });
  console.log(JSON.stringify(checkouts, null, 2));

  console.log('\n--- Latest 5 Enrollments ---');
  const enrollments = await prisma.enrollments.findMany({
    take: 5,
    orderBy: { CreationTime: 'desc' },
    include: { Courses: { select: { Title: true } } }
  });
  console.log(JSON.stringify(enrollments, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
