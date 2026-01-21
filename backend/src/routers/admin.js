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

// =====================================================
// COURSE MANAGEMENT ENDPOINTS
// =====================================================

/**
 * GET /api/admin/courses
 * Get all courses with pagination, search, and filter
 * Query params: page, limit, search, status (ALL|PENDING|APPROVED|REJECTED|ARCHIVED)
 */
router.get('/courses', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'ALL' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const where = {};

        // Search by title, instructor name, or category
        if (search) {
            where.OR = [
                { Title: { contains: search, mode: 'insensitive' } },
                { Instructors: { Users_Instructors_CreatorIdToUsers: { FullName: { contains: search, mode: 'insensitive' } } } },
                { Categories: { Title: { contains: search, mode: 'insensitive' } } }
            ];
        }

        // Filter by status
        if (status === 'PENDING') {
            where.ApprovalStatus = 'Pending';
        } else if (status === 'APPROVED') {
            where.ApprovalStatus = 'APPROVED';
        } else if (status === 'REJECTED') {
            where.ApprovalStatus = 'Rejected';
        } else if (status === 'ARCHIVED') {
            where.Status = 'Archived';
        }

        // Execute queries in parallel
        const [courses, total] = await Promise.all([
            prisma.courses.findMany({
                where,
                skip,
                take: parseInt(limit),
                select: {
                    Id: true,
                    Title: true,
                    ThumbUrl: true,
                    Price: true,
                    Status: true,
                    ApprovalStatus: true,
                    RejectionReason: true,
                    LectureCount: true,
                    LearnerCount: true,
                    RatingCount: true,
                    TotalRating: true,
                    CreationTime: true,
                    Categories: {
                        select: {
                            Id: true,
                            Title: true
                        }
                    },
                    Instructors: {
                        select: {
                            Id: true,
                            Users_Instructors_CreatorIdToUsers: {
                                select: {
                                    Id: true,
                                    FullName: true,
                                    AvatarUrl: true
                                }
                            }
                        }
                    },
                    Sections: {
                        select: {
                            Lectures: {
                                select: {
                                    Id: true
                                }
                            }
                        }
                    }
                },
                orderBy: { CreationTime: 'desc' }
            }),
            prisma.courses.count({ where })
        ]);

        // Map courses to match frontend expected format
        const mappedCourses = courses.map(course => {
            // Calculate total lessons
            const totalLessons = course.Sections.reduce((acc, section) => acc + section.Lectures.length, 0);

            // Calculate rating
            const rating = course.RatingCount > 0
                ? (Number(course.TotalRating) / course.RatingCount).toFixed(1)
                : 0;

            // Map status
            let mappedStatus = 'PENDING';
            if (course.Status === 'Archived') {
                mappedStatus = 'ARCHIVED';
            } else if (course.ApprovalStatus === 'APPROVED') {
                mappedStatus = 'APPROVED';
            } else if (course.ApprovalStatus === 'Rejected') {
                mappedStatus = 'REJECTED';
            } else if (course.ApprovalStatus === 'Pending') {
                mappedStatus = 'PENDING';
            }

            const instructor = course.Instructors?.Users_Instructors_CreatorIdToUsers;

            return {
                id: course.Id,
                title: course.Title,
                thumbnail: course.ThumbUrl || 'https://via.placeholder.com/400x225?text=No+Image',
                price: parseFloat(course.Price),
                status: mappedStatus,
                rejectReason: course.RejectionReason,
                totalLessons,
                totalDuration: `${totalLessons} lessons`,
                enrolledCount: course.LearnerCount,
                rating: parseFloat(rating),
                category: course.Categories?.Title || 'Unknown',
                instructor: {
                    id: instructor?.Id,
                    name: instructor?.FullName || 'Unknown',
                    avatar: instructor?.AvatarUrl || `https://ui-avatars.com/api/?name=Unknown&background=22c55e&color=fff`
                },
                createdAt: course.CreationTime
            };
        });

        res.json({
            courses: mappedCourses,
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
        console.error('Admin get courses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/admin/courses/:id
 * Get course details by ID
 */
router.get('/courses/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const course = await prisma.courses.findUnique({
            where: { Id: id },
            select: {
                Id: true,
                Title: true,
                ThumbUrl: true,
                Intro: true,
                Description: true,
                Price: true,
                Discount: true,
                Level: true,
                Status: true,
                ApprovalStatus: true,
                RejectionReason: true,
                Outcomes: true,
                Requirements: true,
                LectureCount: true,
                LearnerCount: true,
                RatingCount: true,
                TotalRating: true,
                CreationTime: true,
                LastModificationTime: true,
                Categories: {
                    select: {
                        Id: true,
                        Title: true
                    }
                },
                Instructors: {
                    select: {
                        Id: true,
                        Users_Instructors_CreatorIdToUsers: {
                            select: {
                                Id: true,
                                FullName: true,
                                AvatarUrl: true,
                                Email: true
                            }
                        }
                    }
                },
                Sections: {
                    select: {
                        Id: true,
                        Title: true,
                        Lectures: {
                            select: {
                                Id: true,
                                Title: true
                            }
                        }
                    },
                    orderBy: { Index: 'asc' }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Calculate total lessons
        const totalLessons = course.Sections.reduce((acc, section) => acc + section.Lectures.length, 0);

        // Calculate rating
        const rating = course.RatingCount > 0
            ? (Number(course.TotalRating) / course.RatingCount).toFixed(1)
            : 0;

        // Map status
        let mappedStatus = 'PENDING';
        if (course.Status === 'Archived') {
            mappedStatus = 'ARCHIVED';
        } else if (course.ApprovalStatus === 'APPROVED') {
            mappedStatus = 'APPROVED';
        } else if (course.ApprovalStatus === 'Rejected') {
            mappedStatus = 'REJECTED';
        }

        const instructor = course.Instructors?.Users_Instructors_CreatorIdToUsers;

        res.json({
            course: {
                id: course.Id,
                title: course.Title,
                thumbnail: course.ThumbUrl,
                intro: course.Intro,
                description: course.Description,
                price: parseFloat(course.Price),
                discount: parseFloat(course.Discount),
                level: course.Level,
                status: mappedStatus,
                rejectReason: course.RejectionReason,
                outcomes: course.Outcomes,
                requirements: course.Requirements,
                totalLessons,
                totalDuration: `${totalLessons} lessons`,
                enrolledCount: course.LearnerCount,
                rating: parseFloat(rating),
                ratingCount: course.RatingCount,
                category: course.Categories?.Title,
                categoryId: course.Categories?.Id,
                instructor: {
                    id: instructor?.Id,
                    name: instructor?.FullName,
                    avatar: instructor?.AvatarUrl,
                    email: instructor?.Email
                },
                sections: course.Sections.map(s => ({
                    id: s.Id,
                    title: s.Title,
                    lectures: s.Lectures.map(l => ({
                        id: l.Id,
                        title: l.Title
                    }))
                })),
                createdAt: course.CreationTime,
                updatedAt: course.LastModificationTime
            }
        });
    } catch (error) {
        console.error('Admin get course by id error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/admin/courses/:id/approve
 * Approve a course
 */
router.put('/courses/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if course exists
        const existingCourse = await prisma.courses.findUnique({
            where: { Id: id },
            select: { Id: true, Title: true, ApprovalStatus: true, Status: true }
        });

        if (!existingCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Update course approval status
        const updatedCourse = await prisma.courses.update({
            where: { Id: id },
            data: {
                ApprovalStatus: 'APPROVED',
                Status: 'Ongoing',
                RejectionReason: null,
                LastModificationTime: new Date()
            },
            select: {
                Id: true,
                Title: true,
                ApprovalStatus: true,
                Status: true
            }
        });

        res.json({
            success: true,
            message: 'Course approved successfully',
            course: {
                id: updatedCourse.Id,
                title: updatedCourse.Title,
                status: 'APPROVED'
            }
        });
    } catch (error) {
        console.error('Admin approve course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/admin/courses/:id/reject
 * Reject a course with reason
 */
router.put('/courses/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Check if course exists
        const existingCourse = await prisma.courses.findUnique({
            where: { Id: id },
            select: { Id: true, Title: true }
        });

        if (!existingCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Update course status to rejected
        const updatedCourse = await prisma.courses.update({
            where: { Id: id },
            data: {
                ApprovalStatus: 'Rejected',
                RejectionReason: reason || 'Course rejected by admin',
                LastModificationTime: new Date()
            },
            select: {
                Id: true,
                Title: true,
                ApprovalStatus: true,
                RejectionReason: true
            }
        });

        res.json({
            success: true,
            message: 'Course rejected',
            course: {
                id: updatedCourse.Id,
                title: updatedCourse.Title,
                status: 'REJECTED',
                rejectReason: updatedCourse.RejectionReason
            }
        });
    } catch (error) {
        console.error('Admin reject course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PUT /api/admin/courses/:id/archive
 * Archive a course
 */
router.put('/courses/:id/archive', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if course exists
        const existingCourse = await prisma.courses.findUnique({
            where: { Id: id },
            select: { Id: true, Title: true, Status: true }
        });

        if (!existingCourse) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Update course status to archived
        const updatedCourse = await prisma.courses.update({
            where: { Id: id },
            data: {
                Status: 'Archived',
                LastModificationTime: new Date()
            },
            select: {
                Id: true,
                Title: true,
                Status: true
            }
        });

        res.json({
            success: true,
            message: 'Course archived successfully',
            course: {
                id: updatedCourse.Id,
                title: updatedCourse.Title,
                status: 'ARCHIVED'
            }
        });
    } catch (error) {
        console.error('Admin archive course error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

