import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const courseId = '37bf24ab-a5a8-48d6-a6e9-6fba29c25580';
  
  const course = await prisma.courses.findUnique({
    where: { Id: courseId },
    include: {
      Sections: {
        include: {
          Lectures: true
        }
      }
    }
  });

  const enrollment = await prisma.enrollments.findFirst({
    where: { CourseId: courseId }
  });

  if (!course || !enrollment) {
    console.error('Course or enrollment not found');
    return;
  }

  const actualLectureIds = course.Sections.flatMap(s => s.Lectures.map(l => l.Id));
  const completedMilestones = JSON.parse(enrollment.LectureMilestones || '[]');

  console.log('--- Debug Report ---');
  console.log('Course Title:', course.Title);
  console.log('Course.LectureCount (DB field):', course.LectureCount);
  console.log('Actual Lectures in Sections:', actualLectureIds.length);
  console.log('User Completed Milestones:', completedMilestones.length);
  
  if (completedMilestones.length < course.LectureCount) {
    console.log('Mismatch detected: Milestones < LectureCount');
  }
}

main().finally(() => prisma.$disconnect());
