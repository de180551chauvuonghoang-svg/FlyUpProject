import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateJWT);
router.use(authorizeRoles('Admin'));

/**
 * GET /api/admin/users
 * Get all users with pagination, search, and filter
 * Query params: page, limit, search, status (ALL|ACTIVE|LOCKED)
 */
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'ALL' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const where = {};

        // Search by name, email, or username
        if (search) {
            where.OR = [
                { FullName: { contains: search, mode: 'insensitive' } },
                { Email: { contains: search, mode: 'insensitive' } },
                { UserName: { contains: search, mode: 'insensitive' } },
                { Phone: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Filter by status (using IsApproved field: true = ACTIVE, false = LOCKED)
        if (status === 'ACTIVE') {
            where.IsApproved = true;
        } else if (status === 'LOCKED') {
            where.IsApproved = false;
        }

        // Execute queries in parallel
        const [users, total] = await Promise.all([
            prisma.users.findMany({
                where,
                skip,
                take: parseInt(limit),
                select: {
                    Id: true,
                    UserName: true,
                    Email: true,
                    FullName: true,
                    AvatarUrl: true,
                    Role: true,
                    Phone: true,
                    IsVerified: true,
                    IsApproved: true,
                    CreationTime: true,
                    LastModificationTime: true,
                    EnrollmentCount: true,
                    LoginProvider: true
                },
                orderBy: { CreationTime: 'desc' }
            }),
            prisma.users.count({ where })
        ]);

        // Map users to match frontend expected format
        const mappedUsers = users.map(user => ({
            id: user.Id,
            email: user.Email,
            fullName: user.FullName,
            userName: user.UserName,
            phone: user.Phone || '',
            role: user.Role,
            status: user.IsApproved ? 'ACTIVE' : 'LOCKED',
            avatar: user.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.FullName)}&background=a855f7&color=fff`,
            createdAt: user.CreationTime,
            lastLogin: user.LastModificationTime,
            enrollmentCount: user.EnrollmentCount,
            isVerified: user.IsVerified,
            loginProvider: user.LoginProvider
        }));

        res.json({
            users: mappedUsers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/admin/users/:id
 * Get user details by ID
 */
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.users.findUnique({
            where: { Id: id },
            select: {
                Id: true,
                UserName: true,
                Email: true,
                FullName: true,
                AvatarUrl: true,
                Bio: true,
                Role: true,
                Phone: true,
                DateOfBirth: true,
                IsVerified: true,
                IsApproved: true,
                CreationTime: true,
                LastModificationTime: true,
                EnrollmentCount: true,
                LoginProvider: true,
                SystemBalance: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.Id,
                email: user.Email,
                fullName: user.FullName,
                userName: user.UserName,
                phone: user.Phone || '',
                role: user.Role,
                bio: user.Bio,
                dateOfBirth: user.DateOfBirth,
                status: user.IsApproved ? 'ACTIVE' : 'LOCKED',
                avatar: user.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.FullName)}&background=a855f7&color=fff`,
                createdAt: user.CreationTime,
                lastLogin: user.LastModificationTime,
                enrollmentCount: user.EnrollmentCount,
                isVerified: user.IsVerified,
                loginProvider: user.LoginProvider,
                systemBalance: user.SystemBalance?.toString() || '0'
            }
        });
    } catch (error) {
        console.error('Admin get user by id error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/admin/users/:id/lock
 * Lock a user account (set IsApproved to false)
 */
router.put('/users/:id/lock', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body; // Optional lock reason

        // Check if user exists
        const existingUser = await prisma.users.findUnique({
            where: { Id: id },
            select: { Id: true, Role: true, IsApproved: true }
        });

        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Cannot lock admin users
        if (existingUser.Role === 'Admin') {
            return res.status(403).json({ error: 'Cannot lock admin users' });
        }

        // Check if already locked
        if (!existingUser.IsApproved) {
            return res.status(400).json({ error: 'User is already locked' });
        }

        // Lock user
        const updatedUser = await prisma.users.update({
            where: { Id: id },
            data: {
                IsApproved: false,
                LastModificationTime: new Date()
            },
            select: {
                Id: true,
                Email: true,
                FullName: true,
                IsApproved: true
            }
        });

        res.json({
            success: true,
            message: 'User locked successfully',
            user: {
                id: updatedUser.Id,
                email: updatedUser.Email,
                fullName: updatedUser.FullName,
                status: 'LOCKED'
            }
        });
    } catch (error) {
        console.error('Admin lock user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/admin/users/:id/unlock
 * Unlock a user account (set IsApproved to true)
 */
router.put('/users/:id/unlock', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const existingUser = await prisma.users.findUnique({
            where: { Id: id },
            select: { Id: true, IsApproved: true }
        });

        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if already unlocked
        if (existingUser.IsApproved) {
            return res.status(400).json({ error: 'User is already active' });
        }

        // Unlock user
        const updatedUser = await prisma.users.update({
            where: { Id: id },
            data: {
                IsApproved: true,
                AccessFailedCount: 0, // Reset failed login attempts
                LastModificationTime: new Date()
            },
            select: {
                Id: true,
                Email: true,
                FullName: true,
                IsApproved: true
            }
        });

        res.json({
            success: true,
            message: 'User unlocked successfully',
            user: {
                id: updatedUser.Id,
                email: updatedUser.Email,
                fullName: updatedUser.FullName,
                status: 'ACTIVE'
            }
        });
    } catch (error) {
        console.error('Admin unlock user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, activeUsers, lockedUsers, totalCourses] = await Promise.all([
            prisma.users.count(),
            prisma.users.count({ where: { IsApproved: true } }),
            prisma.users.count({ where: { IsApproved: false } }),
            prisma.courses.count()
        ]);

        res.json({
            stats: {
                totalUsers,
                activeUsers,
                lockedUsers,
                totalCourses
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
