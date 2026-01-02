import prisma from '../lib/prisma.js';

// Get all categories with course counts
export const getCategories = async () => {
  try {
    const categories = await prisma.categories.findMany({
      where: {
        IsLeaf: true // Only leaf categories that have courses
      },
      select: {
        Id: true,
        Title: true,
        Description: true,
        CourseCount: true,
        Path: true
      },
      orderBy: {
        Title: 'asc'
      }
    });

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Get courses with optional filters
export const getCourses = async (filters = {}) => {
  try {
    const {
      categoryId,
      level,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 24
    } = filters;

    // Build where clause - Match actual database values
    const where = {
      ApprovalStatus: 'APPROVED', // Match database: 'APPROVED' (uppercase)
      Status: 'Ongoing' // Match database: 'Ongoing' (most courses have this status)
    };

    if (categoryId && categoryId !== 'all') {
      where.LeafCategoryId = categoryId;
    }

    if (level && level !== 'all') {
      where.Level = level;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.Price = {};
      if (minPrice !== undefined) {
        where.Price.gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        where.Price.lte = parseFloat(maxPrice);
      }
    }

    if (search) {
      where.OR = [
        { Title: { contains: search, mode: 'insensitive' } },
        { Description: { contains: search, mode: 'insensitive' } },
        { Intro: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch courses with related data
    const [courses, totalCount] = await Promise.all([
      prisma.courses.findMany({
        where,
        skip,
        take: limit,
        include: {
          Categories: {
            select: {
              Id: true,
              Title: true
            }
          },
          Instructors: {
            include: {
              Users_Instructors_CreatorIdToUsers: {
                select: {
                  Id: true,
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

    // Transform data to match frontend expectations
    const transformedCourses = courses.map(course => {
      const avgRating = course.RatingCount > 0 
        ? (Number(course.TotalRating) / course.RatingCount).toFixed(1)
        : 0;

      const instructor = course.Instructors.Users_Instructors_CreatorIdToUsers;

      return {
        id: course.Id,
        title: course.Title,
        description: course.Intro || course.Description,
        image: course.ThumbUrl || 'https://via.placeholder.com/400x225?text=Course+Image',
        category: course.Categories.Title,
        categoryId: course.Categories.Id,
        rating: parseFloat(avgRating),
        reviews: course.RatingCount,
        duration: `${course.LectureCount || 0} lectures`,
        level: course.Level,
        price: parseFloat(course.Price).toFixed(2),
        discount: course.Discount > 0 ? parseFloat(course.Discount).toFixed(2) : null,
        instructorName: instructor.FullName,
        instructorImg: instructor.AvatarUrl || 'https://via.placeholder.com/100?text=Instructor',
        learnerCount: course.LearnerCount,
        createdAt: course.CreationTime
      };
    });

    return {
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Get single course by ID
export const getCourseById = async (courseId) => {
  try {
    const course = await prisma.courses.findUnique({
      where: {
        Id: courseId,
        ApprovalStatus: 'Approved',
        Status: 'Published'
      },
      include: {
        Categories: true,
        Instructors: {
          include: {
            Users_Instructors_CreatorIdToUsers: true
          }
        },
        Sections: {
          include: {
            Lectures: true
          },
          orderBy: {
            Index: 'asc'
          }
        }
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};
