import prisma from '../lib/prisma.js';

/**
 * Get notifications for the current user
 */
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 20, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [notifications, total] = await Promise.all([
            prisma.notifications.findMany({
                where: { ReceiverId: userId },
                include: {
                    Users_Notifications_CreatorIdToUsers: {
                        select: { FullName: true, AvatarUrl: true }
                    }
                },
                orderBy: { CreationTime: 'desc' },
                take: parseInt(limit),
                skip: skip
            }),
            prisma.notifications.count({
                where: { ReceiverId: userId }
            })
        ]);

        res.json({
            success: true,
            data: notifications,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const notification = await prisma.notifications.findUnique({
            where: { Id: id }
        });

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        if (notification.ReceiverId !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized to mark this notification as read' });
        }

        await prisma.notifications.update({
            where: { Id: id },
            data: { Status: 'Read' }
        });

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};

/**
 * Get unread count
 */
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.userId;

        const count = await prisma.notifications.count({
            where: { 
                ReceiverId: userId,
                Status: 'Unread'
            }
        });

        res.json({ success: true, count });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
