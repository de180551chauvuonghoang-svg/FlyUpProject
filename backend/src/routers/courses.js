import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Get all courses with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    // Filter by category
    if (category) {
      where.LeafCategoryId = category;
    }

    // Search by title
    if (search) {
      where.Title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [courses, total] = await Promise.all([
      prisma.courses.findMany({
        where,
        skip,
        take,
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
        },
        orderBy: {
          CreationTime: 'desc'
        }
      }),
      prisma.courses.count({ where })
    ]);

    res.json({
      courses: courses.map(course => ({
        ...course,
        instructor: course.Instructors?.Users_Instructors_CreatorIdToUsers
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single course by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.courses.findUnique({
      where: { Id: id },
      include: {
        Categories: true,
        Instructors: {
          include: {
            Users_Instructors_CreatorIdToUsers: {
              select: {
                FullName: true,
                AvatarUrl: true,
                Bio: true
              }
            }
          }
        },
        Sections: {
          orderBy: { Index: 'asc' },
          include: {
            Lectures: {
              orderBy: { CreationTime: 'asc' }
            },
            Assignments: true
          }
        },
        CourseReviews: {
          include: {
            Users: {
              select: {
                FullName: true,
                AvatarUrl: true
              }
            }
          },
          orderBy: { CreationTime: 'desc' },
          take: 10
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ 
      course: {
        ...course,
        instructor: course.Instructors?.Users_Instructors_CreatorIdToUsers
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { Title: 'asc' }
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get featured courses (courses with high ratings)
router.get('/featured/list', async (req, res) => {
  try {
    const courses = await prisma.courses.findMany({
      where: {
        Status: 'Published',
        RatingCount: { gt: 0 }
      },
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
      },
      orderBy: [
        { TotalRating: 'desc' },
        { LearnerCount: 'desc' }
      ],
      take: 6
    });

    res.json({ 
      courses: courses.map(course => ({
        ...course,
        instructor: course.Instructors?.Users_Instructors_CreatorIdToUsers,
        averageRating: course.RatingCount > 0 
          ? Number(course.TotalRating) / course.RatingCount 
          : 0
      }))
    });
  } catch (error) {
    console.error('Get featured courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
