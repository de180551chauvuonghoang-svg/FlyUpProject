import prisma from "../lib/prisma.js";
import cache, { safeGet, safeSet } from "../lib/cache.js";

// Helper to handle BigInt serialization
const jsonReplacer = (key, value) => {
  return typeof value === "bigint" ? value.toString() : value;
};

// const cache = new NodeCache({ stdTTL: 300 }); // Removed NodeCache

// Get all categories with course counts
export const getCategories = async () => {
  try {
    const cacheKey = "categories_all";
    const cachedResult = await safeGet(cacheKey);
    if (cachedResult) return JSON.parse(cachedResult);

    const categories = await prisma.categories.findMany({
      where: {
        IsLeaf: true, // Only leaf categories that have courses
      },
      select: {
        Id: true,
        Title: true,
        Description: true,
        CourseCount: true,
        Path: true,
      },
      orderBy: {
        Title: "asc",
      },
    });

    await safeSet(
      cacheKey,
      JSON.stringify(categories, jsonReplacer),
      "EX",
      300,
    ); // 5 Minutes
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
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
      limit = 12, // Reduced from 24 to 12 for faster loading
      sortBy = "newest",
    } = filters;

    // Check if filters are default (only page might differ) to decide whether to cache
    // We only cache the first few pages of the default view to save Redis memory from random search queries
    const isDefaultView =
      !categoryId &&
      !level &&
      !minPrice &&
      !maxPrice &&
      !search &&
      (!sortBy || sortBy === "newest");
    const shouldCache = isDefaultView && page <= 5; // Cache only first 5 pages of default list

    const cacheKey = `courses:default:page:${page}:limit:${limit}`;

    if (shouldCache) {
      const cachedResult = await safeGet(cacheKey);
      if (cachedResult) {
        console.log("Serving courses from Redis cache");
        return JSON.parse(cachedResult);
      }
    }

    // Build where clause - Match actual database values
    const where = {
      ApprovalStatus: "APPROVED", // Match database: 'APPROVED' (uppercase)
      Status: "Ongoing", // Match database: 'Ongoing' (most courses have this status)
    };

    if (categoryId && categoryId !== "all") {
      where.LeafCategoryId = categoryId;
    }

    if (level && level !== "all") {
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
        { Title: { contains: search, mode: "insensitive" } },
        { Description: { contains: search, mode: "insensitive" } },
        { Intro: { contains: search, mode: "insensitive" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch courses with selective fields for performance
    console.time("DB_QUERY_TIME");
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
              Title: true,
            },
          },
          Instructors: {
            select: {
              Users_Instructors_CreatorIdToUsers: {
                select: {
                  FullName: true,
                  AvatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: (function () {
          switch (sortBy) {
            case "price_asc":
              return { Price: "asc" };
            case "price_desc":
              return { Price: "desc" };
            case "popular":
              return { LearnerCount: "desc" };
            case "rating":
              return { TotalRating: "desc" };
            case "newest":
            default:
              return { CreationTime: "desc" };
          }
        })(),
      }),
      prisma.courses.count({ where }),
    ]);
    console.timeEnd("DB_QUERY_TIME");

    // Transform data to match frontend expectations
    const transformedCourses = courses.map((course) => {
      const avgRating =
        course.RatingCount > 0
          ? (Number(course.TotalRating) / course.RatingCount).toFixed(1)
          : 0;

      const instructor = course.Instructors.Users_Instructors_CreatorIdToUsers;

      return {
        id: course.Id,
        title: course.Title,
        description: course.Intro || course.Description,
        image:
          course.ThumbUrl ||
          "https://via.placeholder.com/400x225?text=Course+Image",
        category: course.Categories.Title,
        categoryId: course.Categories.Id,
        rating: parseFloat(avgRating),
        reviews: course.RatingCount,
        duration: `${course.LectureCount || 0} lectures`,
        level: course.Level,
        price: parseFloat(course.Price).toFixed(2),
        discount:
          course.Discount > 0 ? parseFloat(course.Discount).toFixed(2) : null,
        instructorName: instructor.FullName,
        instructorImg:
          instructor.AvatarUrl ||
          "https://via.placeholder.com/100?text=Instructor",
        learnerCount: course.LearnerCount,
        createdAt: course.CreationTime,
      };
    });

    const result = {
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    if (shouldCache) {
      await safeSet(cacheKey, JSON.stringify(result, jsonReplacer), "EX", 300); // 5 Minutes
    }
    return result;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};

// Get single course by ID
export const getCourseById = async (courseId, { skipStatusFilter = false } = {}) => {
  try {
    console.log("[courseService] Fetching course:", courseId, { skipStatusFilter });

    // Always fetch fresh course detail because lecture video/material updates
    // happen frequently and must appear immediately on learning pages.

    const whereClause = { Id: courseId };
    if (!skipStatusFilter) {
      whereClause.ApprovalStatus = "APPROVED";
      whereClause.Status = "Ongoing";
    }

    const course = await prisma.courses.findFirst({
      where: whereClause,
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
            Description: true,
          },
        },
        Instructors: {
          select: {
            Id: true,
            CreatorId: true,
            Users_Instructors_CreatorIdToUsers: {
              select: {
                Id: true,
                FullName: true,
                AvatarUrl: true,
              },
            },
          },
        },
        Sections: {
          select: {
            Id: true,
            Title: true,
            CreationTime: true,
            // Fetch lectures with materials
            Lectures: {
              select: {
                Id: true,
                Title: true,
                Content: true,
                IsPreviewable: true,
                CreationTime: true,
                // Include video and materials from LectureMaterial table
                LectureMaterial: {
                  select: {
                    Id: true,
                    Type: true,
                    Url: true,
                  },
                  orderBy: {
                    Id: "asc",
                  },
                },
              },
              orderBy: {
                CreationTime: "asc",
              },
            },
          },
          orderBy: {
            CreationTime: "asc",
          },
        },
      },
    });

    console.log("[courseService] Course found:", course ? "Yes" : "No");

    if (!course) {
      throw new Error("Course not found");
    }

    // Transform LectureMaterial into VideoUrl and Materials array
    if (course.Sections) {
      course.Sections = course.Sections.map((section) => {
        if (section.Lectures) {
          section.Lectures = section.Lectures.map((lecture) => {
            const materials = lecture.LectureMaterial || [];

            // Pick the latest video material (highest Id) to avoid stale/old links.
            const videoMaterials = materials.filter(
              (m) => m.Type.toLowerCase() === "video",
            );
            const videoMaterial =
              videoMaterials.length > 0
                ? videoMaterials[videoMaterials.length - 1]
                : null;

            // Get other materials (documents, PDFs, etc.)
            const documentMaterials = materials.filter(
              (m) => m.Type.toLowerCase() !== "video",
            );

            // Return lecture with VideoUrl and Materials
            return {
              ...lecture,
              VideoUrl: videoMaterial?.Url || null,
              Materials: documentMaterials.map((m) => ({
                Id: m.Id,
                Type: m.Type,
                Url: m.Url,
                Name: m.Type + " Material", // You can improve this if you store names
              })),
              // Remove raw LectureMaterial to avoid confusion
              LectureMaterial: undefined,
            };
          });
        }
        return section;
      });
    }

    return course;
  } catch (error) {
    console.error("[courseService] Error fetching course:", error);
    throw error;
  }
};
