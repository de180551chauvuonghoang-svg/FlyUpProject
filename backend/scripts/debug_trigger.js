import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const prisma = (await import('../src/lib/prisma.js')).default;
const notificationService = await import('../src/services/notificationService.js');

async function debugTrigger() {
  try {
    console.log('--- Debug Notification Trigger ---');
    
    // 1. Find a valid instructor and course
    const instructor = await prisma.instructors.findFirst({
        include: { Users_Instructors_CreatorIdToUsers: true }
    });
    const course = await prisma.courses.findFirst();

    if (!instructor || !course) {
      console.error('Could not find instructor or course for test');
      return;
    }

    const userId = instructor.CreatorId;
    const instructorRecordId = instructor.Id;
    const instructorName = instructor.Users_Instructors_CreatorIdToUsers?.FullName || 'Test Instructor';
    
    console.log(`Using Instructor User ID: ${userId}`);
    console.log(`Using Instructor Record ID: ${instructorRecordId}`);
    console.log(`Using Course ID: ${course.Id} ("${course.Title}")`);

    // 2. Trigger notification
    console.log('\nCalling notificationService.createSubmissionNotification...');
    await notificationService.createSubmissionNotification(
        course.Id,
        instructorRecordId,
        userId,
        instructorName,
        `DEBUG TEST: ${course.Title}`,
        course.Price
    );
    console.log('✅ Service call completed without error');

    // 3. Verify in database
    console.log('\nVerifying in Notifications table...');
    const lastNotif = await prisma.notifications.findFirst({
        where: { ReceiverId: userId, Type: 'SUBMISSION_CONFIRMED' },
        orderBy: { CreationTime: 'desc' }
    });

    if (lastNotif && lastNotif.Message.includes('DEBUG TEST')) {
      console.log('🎉 SUCCESS! Notification found in database:');
      console.log(JSON.stringify(lastNotif, null, 2));
    } else {
      console.log('❌ FAILURE: Notification NOT found in database or mismatch!');
    }

    console.log('\nVerifying in CourseNotifications table...');
    const lastCourseNotif = await prisma.courseNotifications.findFirst({
        where: { CourseId: course.Id, NotificationType: 'Submission' },
        orderBy: { CreationTime: 'desc' }
    });

    if (lastCourseNotif && lastCourseNotif.CourseTitle.includes('DEBUG TEST')) {
      console.log('🎉 SUCCESS! CourseNotification found in database:');
      console.log(JSON.stringify(lastCourseNotif, null, 2));
    } else {
      console.log('❌ FAILURE: CourseNotification NOT found in database or mismatch!');
    }

  } catch (error) {
    console.error('\n💥 CRITICAL ERROR during debug trigger:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTrigger();
