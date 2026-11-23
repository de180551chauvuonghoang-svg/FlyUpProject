import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const prisma = (await import('../src/lib/prisma.js')).default;

async function getIds() {
  try {
    const instructor = await prisma.instructors.findFirst({
        select: { Id: true, CreatorId: true }
    });
    const course = await prisma.courses.findFirst({
        select: { Id: true, Title: true, Price: true }
    });

    console.log(JSON.stringify({ instructor, course }, null, 2));

  } catch (error) {
    console.error('Error getting IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getIds();
