// Removed top-level static import for prisma to ensure dynamic loading after env vars

/**
 * Creates a notification for a specific user
 * @param {string} receiverId - ID of the user to receive the notification
 * @param {string} message - Notification message
 * @param {string} type - Type of notification (e.g., 'COURSE_PUBLISHED', 'COURSE_COMPLETED')
 * @param {string} creatorId - ID of the user who triggered the notification (optional)
 * @returns {Promise<object>} - Created notification object
 */
export const createNotification = async (receiverId, message, type, creatorId = null) => {
    const prisma = (await import('../lib/prisma.js')).default;
    try {
        console.log(`[NotificationService] Creating ${type} for user ${receiverId}`);
        // If no creatorId provided, use receiverId as creator (system notification)
        const actualCreatorId = creatorId || receiverId;

        return await prisma.notifications.create({
            data: {
                Message: message,
                Type: type,
                Status: 'Unread',
                ReceiverId: receiverId,
                CreatorId: actualCreatorId,
                CreationTime: new Date()
            }
        });
    } catch (error) {
        console.error('[NotificationService] Error creating notification:', error);
        return null;
    }
};

/**
 * Creates a notification for all administrators
 * @param {string} message - Notification message
 * @param {string} type - Type of notification
 * @param {string} creatorId - ID of the user who triggered the notification
 */
export const notifyAdmins = async (message, type, creatorId) => {
    const prisma = (await import('../lib/prisma.js')).default;
    try {
        console.log(`[NotificationService] Notifying all admins: ${type}`);
        const admins = await prisma.users.findMany({
            where: { 
                Role: {
                    equals: 'admin',
                    mode: 'insensitive'
                }
            },
            select: { Id: true }
        });

        const promises = admins.map(admin => 
            createNotification(admin.Id, message, type, creatorId)
        );

        await Promise.all(promises);
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
};

/**
 * Create notification for course submission
 * @param {string} courseId - ID of the course
 * @param {string} instructorRecordId - ID of the instructor in Instructors table
 * @param {string} receiverUserId - ID of the instructor in Users table (for the bell icon)
 * @param {string} instructorName - Full name of the instructor
 * @param {string} courseTitle - Title of the course
 * @param {number} coursePrice - Price of the course
 */
export const createSubmissionNotification = async (courseId, instructorRecordId, receiverUserId, instructorName, courseTitle, coursePrice = 0) => {
    const prisma = (await import('../lib/prisma.js')).default;
    console.log(`[NotificationService] createSubmissionNotification for course: ${courseTitle}`);
    const message = `Instructor ${instructorName} has submitted a new course: "${courseTitle}" for review.`;
    
    // 1. Create specialized CourseNotification for Admin moderation panel
    await prisma.courseNotifications.create({
        data: {
          CourseId: courseId,
          InstructorId: instructorRecordId,
          InstructorName: instructorName,
          CourseTitle: courseTitle,
          CoursePrice: parseFloat(coursePrice) || 0,
          NotificationType: "Submission",
          Status: "Pending",
        },
    });

    // 2. Create general Notifications for all admins (for the bell icon)
    await notifyAdmins(message, 'COURSE_SUBMISSION', receiverUserId);

    // 3. Create a confirmation notification for the instructor
    await createNotification(
        receiverUserId, 
        `Your course "${courseTitle}" has been submitted for review.`, 
        'SUBMISSION_CONFIRMED'
    );
};

/**
 * Create notification for course creation
 */
export const createCourseCreationNotification = async (instructorUserId, courseTitle) => {
    const message = `You have successfully created the course draft: "${courseTitle}". Don't forget to publish it for review when you're ready!`;
    await createNotification(instructorUserId, message, 'COURSE_CREATED');
};

/**
 * Create notification for course approval
 */
export const createApprovalNotification = async (instructorUserId, courseTitle) => {
    const message = `Great news! Your course "${courseTitle}" has been approved and is now live!`;
    await createNotification(instructorUserId, message, 'COURSE_PUBLISHED');
};

/**
 * Create notification for course rejection
 */
export const createRejectionNotification = async (instructorUserId, courseTitle, reason) => {
    const message = `Your course "${courseTitle}" was not approved. Reason: ${reason}`;
    await createNotification(instructorUserId, message, 'COURSE_REJECTED');
};

/**
 * Create notification for course archive
 */
export const createArchiveNotification = async (instructorUserId, courseTitle, reason) => {
    const message = `Your course "${courseTitle}" has been archived. ${reason ? `Reason: ${reason}` : ''}`;
    await createNotification(instructorUserId, message, 'COURSE_ARCHIVED');
};

/**
 * Create notification for course unarchive
 */
export const createUnarchiveNotification = async (instructorUserId, courseTitle) => {
    const message = `Your course "${courseTitle}" has been unarchived and is back online!`;
    await createNotification(instructorUserId, message, 'COURSE_UNARCHIVED');
};

/**
 * Create notification for course completion
 */
export const createCompletionNotification = async (userId, courseId, courseTitle) => {
    const message = `Congratulations! You have successfully completed the course "${courseTitle}". Your certificate is now available.`;
    await createNotification(userId, message, 'COURSE_COMPLETED');
};
