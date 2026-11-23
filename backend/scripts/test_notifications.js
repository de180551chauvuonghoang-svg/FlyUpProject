import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Import prisma after loading env vars
const prisma = (await import('../src/lib/prisma.js')).default;

async function checkNotifications() {
  try {
    const notifications = await prisma.notifications.findMany({
      orderBy: { CreationTime: 'desc' },
      take: 10,
      include: {
        Users_Notifications_ReceiverIdToUsers: {
          select: { FullName: true, Email: true, Role: true }
        }
      }
    });

    console.log('--- Recent Notifications (Top 10) ---');
    notifications.forEach((n, i) => {
      const recipient = n.Users_Notifications_ReceiverIdToUsers;
      console.log(`${i+1}. [${n.Type}] to ${recipient ? recipient.FullName : 'SYSTEM/UNKNOWN'} (${n.ReceiverId})`);
      console.log(`   Message: ${n.Message}`);
      console.log(`   Status: ${n.Status} | Time: ${n.CreationTime}`);
      console.log('---');
    });

    const courseNotifs = await prisma.courseNotifications.findMany({
      orderBy: { CreationTime: 'desc' },
      take: 5
    });

    console.log('\n--- Recent CourseNotifications (Admin Panel) ---');
    courseNotifs.forEach((n, i) => {
      console.log(`${i+1}. [${n.NotificationType}] for "${n.CourseTitle}" by ${n.InstructorName}`);
      console.log(`   Status: ${n.Status} | Time: ${n.CreationTime}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error checking notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNotifications();
