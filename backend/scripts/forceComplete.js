import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log('--- Force Complete Script Starting ---');
console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);

async function main() {
  const courseId = '37bf24ab-a5a8-48d6-a6e9-6fba29c25580';
  
  // Find enrollment
  const enrollment = await prisma.enrollments.findFirst({
    where: { CourseId: courseId },
    include: {
      Courses: {
        include: {
          Sections: {
            include: {
              Lectures: true
            }
          }
        }
      }
    }
  });

  if (!enrollment) {
    console.error('No enrollment found for course:', courseId);
    return;
  }

  // Get all lecture IDs
  const allLectureIds = enrollment.Courses.Sections.flatMap(s => s.Lectures.map(l => l.Id));
  
  console.log(`Marking ${allLectureIds.length} lectures as complete for user ${enrollment.CreatorId}...`);

  await prisma.enrollments.update({
    where: {
      CreatorId_CourseId: {
        CreatorId: enrollment.CreatorId,
        CourseId: courseId
      }
    },
    data: {
      LectureMilestones: JSON.stringify(allLectureIds)
    }
  });

  // Also create LectureCompletions records
  for (const lectureId of allLectureIds) {
    try {
      await prisma.lectureCompletions.upsert({
        where: {
          EnrollmentId_LectureId: {
            EnrollmentId: enrollment.Id || `${enrollment.CreatorId}_${enrollment.CourseId}`,
            LectureId: lectureId
          }
        },
        update: {
          CompletedAt: new Date()
        },
        create: {
          EnrollmentId: enrollment.Id || `${enrollment.CreatorId}_${enrollment.CourseId}`,
          LectureId: lectureId,
          CompletedAt: new Date()
        }
      });
    } catch (e) {
      // ignore errors for individual upserts if they happen
    }
  }

  console.log('✅ Done! Please refresh the page.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
