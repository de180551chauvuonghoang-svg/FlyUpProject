import prisma from '../lib/prisma.js';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// Get all categories with course counts
export const getCategories = async () => {
  try {
    const cacheKey = 'categories_all';
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) return cachedResult;

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

    cache.set(cacheKey, categories);
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
      limit = 12 // Reduced from 24 to 12 for faster loading
    } = filters;

    // Create a unique cache key based on filters
    const cacheKey = `courses_${JSON.stringify(filters)}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      console.log('Serving courses from cache');
      return cachedResult;
    }

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

    // Fetch courses with selective fields for performance
    console.time('DB_QUERY_TIME');
    const [courses, totalCount] = await Promise.all([
      prisma.courses.findMany({
        where,
        skip,
        take: limit,
        select: {
          Id: true,
          Title: true,
          Intro: true,
          Description: true,
          ThumbUrl: true,
          Price: true,
          Discount: true,
          Level: true,
          RatingCount: true,
          TotalRating: true,
          LectureCount: true,
          LearnerCount: true,
          CreationTime: true,
          Categories: {
            select: {
              Id: true,
              Title: true
            }
          },
          Instructors: {
            select: {
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
    console.timeEnd('DB_QUERY_TIME');

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

    const result = {
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Get single course by ID
export const getCourseById = async (courseId) => {
  try {
    console.log('[courseService] Fetching course:', courseId);
    
    const course = await prisma.courses.findFirst({
      where: {
        Id: courseId,
        ApprovalStatus: 'APPROVED', // Match actual DB value
        Status: 'Ongoing' // Match actual DB value
      },
      select: {
        // Core fields
        Id: true,
        Title: true,
        Intro: true,
        Description: true,
        ThumbUrl: true,
        Price: true,
        Discount: true,
        Level: true,
        Status: true,
        
        // Stats
        RatingCount: true,
        TotalRating: true,
        LectureCount: true,
        LearnerCount: true,
        
        // Timestamps
        CreationTime: true,
        
        // Relations with selective fields
        Categories: {
          select: {
            Id: true,
            Title: true,
            Description: true
          }
        },
        Instructors: {
          select: {
            Id: true,
            CreatorId: true,
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
            Id: true,
            Title: true,
            CreationTime: true,
            // Only fetch lecture count, not full lecture content
            Lectures: {
              select: {
                Id: true,
                Title: true
              }
            }
          },
          orderBy: {
            CreationTime: 'asc'
          }
        }
      }
    });

    console.log('[courseService] Course found:', course ? 'Yes' : 'No');

    if (!course) {
      throw new Error('Course not found');
    }

    return course;
  } catch (error) {
    console.error('[courseService] Error fetching course:', error);
    throw error;
  }
};
