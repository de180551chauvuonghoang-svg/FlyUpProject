import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management API
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user profile by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile data
 *       404:
 *         description: User not found
 */
router.get('/:id', async (req, res) => {
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
        DateOfBirth: true,
        Phone: true,
        EnrollmentCount: true,
        CreationTime: true,
        IsVerified: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               FullName:
 *                 type: string
 *               Bio:
 *                 type: string
 *               Phone:
 *                 type: string
 *               DateOfBirth:
 *                 type: string
 *                 format: date-time
 *               AvatarUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { FullName, Bio, Phone, DateOfBirth, AvatarUrl } = req.body;

    const user = await prisma.users.update({
      where: { Id: id },
      data: {
        FullName,
        Bio,
        Phone,
        DateOfBirth: DateOfBirth ? new Date(DateOfBirth) : undefined,
        AvatarUrl,
        LastModificationTime: new Date()
      },
      select: {
        Id: true,
        UserName: true,
        Email: true,
        FullName: true,
        AvatarUrl: true,
        Bio: true,
        Role: true,
        DateOfBirth: true,
        Phone: true
      }
    });

    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /users/{id}/enrollments:
 *   get:
 *     summary: Get user's enrolled courses
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of enrollments
 */
router.get('/:id/enrollments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    console.log(`[API] Get Enrollments for User ${id} - Page ${page}`);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [enrollments, total] = await Promise.all([
      prisma.enrollments.findMany({
        where: { CreatorId: id },
        skip,
        take: parseInt(limit),
        include: {
          Courses: {
            include: {
              Categories: true,
              Instructors: {
                include: {
                  Users_Instructors_CreatorIdToUsers: {
                    select: {
                      FullName: true,
                      AvatarUrl: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { CreationTime: 'desc' }
      }),
      prisma.enrollments.count({ where: { CreatorId: id } })
    ]);
    
    console.log(`[API] Found ${total} enrollments. Returning ${enrollments.length} items.`);
    if (enrollments.length > 0 && !enrollments[0].Courses) {
        console.error('[API] CRITICAL: Enrollment found but Course data is missing (null relation)!');
    }

    res.json({
      enrollments: enrollments.map(e => {
        const course = {
          ...e.Courses,
          TotalRating: e.Courses?.TotalRating?.toString() || '0',
          instructor: e.Courses?.Instructors?.Users_Instructors_CreatorIdToUsers
        };
        // Remove raw Instructors object which contains BigInt Balance
        // We only need the mapped 'instructor' (user) details
        if (course.Instructors) {
            delete course.Instructors;
        }
        const { Courses, ...rest } = e;
        return {
          ...rest,
          course
        };
      }),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { FullName: { contains: search, mode: 'insensitive' } },
        { Email: { contains: search, mode: 'insensitive' } },
        { UserName: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

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
          IsVerified: true,
          CreationTime: true,
          EnrollmentCount: true
        },
        orderBy: { CreationTime: 'desc' }
      }),
      prisma.users.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
