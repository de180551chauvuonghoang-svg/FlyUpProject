import prisma from "../lib/prisma.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

// Get all categories with course counts
export const getCategories = async () => {
  try {
    const cacheKey = "categories_all";
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) return cachedResult;

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

    cache.set(cacheKey, categories);
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

    // Create a unique cache key based on filters
    const cacheKey = `courses_${JSON.stringify(filters)}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      console.log("Serving courses from cache");
      return cachedResult;
    }

    // Build where clause - Accept both Approved and APPROVED for compatibility
    const where = {
      OR: [{ ApprovalStatus: "APPROVED" }, { ApprovalStatus: "Approved" }],
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

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }
};

// Get single course by ID
export const getCourseById = async (courseId) => {
  try {
    console.log("[courseService] Fetching course:", courseId);

    const cacheKey = `course_${courseId}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      console.log("[courseService] Serving course from cache:", courseId);
      return cachedResult;
    }

    const course = await prisma.courses.findFirst({
      where: {
        Id: courseId,
        ApprovalStatus: "APPROVED", // Match actual DB value
        Status: "Ongoing", // Match actual DB value
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
            // Fetch full lecture content with materials
            Lectures: {
              select: {
                Id: true,
                Title: true,
                Content: true,
                IsPreviewable: true,
                LectureMaterial: {
                  select: {
                    Type: true,
                    Url: true,
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

    cache.set(cacheKey, course);
    return course;
  } catch (error) {
    console.error("[courseService] Error fetching course:", error);
    throw error;
  }
};

// Get instructor's courses
export const getInstructorCourses = async (instructorId, filters = {}) => {
  try {
    const { status = "all", page = 1, limit = 10 } = filters;

    const skip = (page - 1) * limit;

    console.log(
      "[getInstructorCourses] Fetching for instructorId:",
      instructorId,
      "filters:",
      filters,
    );

    // Build where clause
    const where = { InstructorId: instructorId };
    if (status !== "all") {
      // Map frontend status to database Status
      const statusMap = {
        published: "Ongoing",
        draft: "Draft",
        archived: "Archived",
      };
      where.Status = statusMap[status] || status;
    }

    console.log("[getInstructorCourses] Where clause:", where);

    // Get total count
    const total = await prisma.courses.count({ where });
    console.log("[getInstructorCourses] Total courses:", total);

    // Get courses
    const courses = await prisma.courses.findMany({
      where,
      select: {
        Id: true,
        Title: true,
        Intro: true,
        Description: true,
        Price: true,
        Discount: true,
        Status: true,
        ThumbUrl: true,
        TotalRating: true,
        RatingCount: true,
        LearnerCount: true,
        Sections: {
          select: {
            Lectures: {
              select: { Id: true },
            },
          },
        },
      },
      orderBy: { CreationTime: "desc" },
      skip,
      take: limit,
    });

    console.log("[getInstructorCourses] Found courses:", courses.length);
    if (courses.length > 0) {
      console.log("[getInstructorCourses] First course:", {
        id: courses[0].Id,
        title: courses[0].Title,
        status: courses[0].Status,
      });
    }

    // Calculate lecture count and transform data
    const coursesWithLectureCount = courses.map((course) => ({
      id: course.Id,
      title: course.Title,
      shortDescription: course.Intro,
      description: course.Description,
      price: course.Price,
      discountPrice: course.Discount,
      status: course.Status,
      thumbnailUrl: course.ThumbUrl,
      rating:
        course.RatingCount > 0
          ? Number(course.TotalRating) / course.RatingCount
          : 0,
      reviewCount: course.RatingCount,
      studentCount: course.LearnerCount,
      lectureCount: course.Sections.reduce(
        (acc, section) => acc + section.Lectures.length,
        0,
      ),
    }));

    return {
      data: coursesWithLectureCount,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("[courseService] Error fetching instructor courses:", error);
    throw error;
  }
};

// Get instructor stats
export const getInstructorStats = async (instructorId) => {
  try {
    // Get instructor data
    const instructor = await prisma.instructors.findUnique({
      where: { Id: instructorId },
      select: {
        Id: true,
        Intro: true,
        Courses: {
          select: {
            Id: true,
            Status: true,
            LearnerCount: true,
            Price: true,
            Discount: true,
            Sections: {
              select: {
                Lectures: {
                  select: { Id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!instructor) {
      return null;
    }

    // Calculate stats
    const totalCourses = instructor.Courses.length;
    const publishedCourses = instructor.Courses.filter(
      (c) => c.Status === "Ongoing",
    ).length;
    const totalStudents = instructor.Courses.reduce(
      (sum, c) => sum + (c.LearnerCount || 0),
      0,
    );
    const totalLectures = instructor.Courses.reduce(
      (sum, c) =>
        sum +
        c.Sections.reduce(
          (sectionSum, section) => sectionSum + section.Lectures.length,
          0,
        ),
      0,
    );

    // Calculate revenue (simplified - just price * student count)
    const totalRevenue = instructor.Courses.reduce((sum, course) => {
      const price = course.Discount > 0 ? course.Discount : course.Price || 0;
      return sum + price * (course.LearnerCount || 0);
    }, 0);

    return {
      totalCourses,
      publishedCourses,
      totalStudents,
      totalLectures,
      totalRevenue: totalRevenue.toFixed(2),
    };
  } catch (error) {
    console.error("[courseService] Error fetching instructor stats:", error);
    throw error;
  }
};

// Create new course
export const createCourse = async (courseData) => {
  try {
    const {
      title,
      description,
      price,
      level,
      instructorId,
      sections = [],
    } = courseData;

    console.log("[courseService] Creating course:", {
      title,
      instructorId,
      sectionCount: sections.length,
    });

    // Check if instructor exists, if not create one
    // Use findFirst instead of findUnique because CreatorId is not a unique field
    let instructor = await prisma.instructors.findFirst({
      where: { CreatorId: instructorId },
    });

    if (!instructor) {
      console.log(
        "[courseService] Creating instructor for user:",
        instructorId,
      );
      instructor = await prisma.instructors.create({
        data: {
          CreatorId: instructorId,
        },
      });
    }

    // Get default category
    const defaultCategory = await prisma.categories.findFirst({
      where: {
        IsLeaf: true,
      },
    });

    if (!defaultCategory) {
      throw new Error(
        "No default category found. Please set up categories first.",
      );
    }

    // Create course with sections
    const newCourse = await prisma.courses.create({
      data: {
        Title: title,
        MetaTitle: title,
        Description: description || "",
        Price: parseFloat(price) || 0,
        Level: level || "Beginner",
        LeafCategoryId: defaultCategory.Id,
        InstructorId: instructor.Id,
        CreatorId: instructorId,
        LastModifierId: instructorId,
        Status: "Draft",
        Sections: {
          create: sections.map((section, sectionIndex) => ({
            Title: section.title || `Section ${sectionIndex + 1}`,
            Index: sectionIndex,
            Lectures: {
              create: (section.lectures || []).map((lecture, lectureIndex) => ({
                Title: lecture.title || `Lecture ${lectureIndex + 1}`,
                Content: lecture.description || "",
              })),
            },
          })),
        },
      },
      include: {
        Sections: {
          include: {
            Lectures: true,
          },
        },
      },
    });

    console.log("[courseService] Course created successfully:", newCourse.Id);
    return newCourse;
  } catch (error) {
    console.error("[courseService] Error creating course:", error);
    throw error;
  }
};

// Publish course (change status to Ongoing and auto-approve)
export const publishCourse = async (courseId, instructorId) => {
  try {
    console.log(
      "[courseService] Publishing course:",
      courseId,
      "by instructor:",
      instructorId,
    );

    // Check if course exists and belongs to instructor
    const course = await prisma.courses.findUnique({
      where: { Id: courseId },
      include: {
        Instructors: {
          select: {
            CreatorId: true,
          },
        },
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.Instructors.CreatorId !== instructorId) {
      throw new Error("You do not have permission to publish this course");
    }

    // Update course status and approval (match DB values used in getCourses)
    const updatedCourse = await prisma.courses.update({
      where: { Id: courseId },
      data: {
        Status: "Ongoing",
        ApprovalStatus: "Approved", // Will be normalized by DB
        LastModificationTime: new Date(),
      },
    });

    console.log("[courseService] Course published successfully:", courseId);
    return updatedCourse;
  } catch (error) {
    console.error("[courseService] Error publishing course:", error);
    throw error;
  }
};

// Unpublish course (change status back to Draft)
export const unpublishCourse = async (courseId, instructorId) => {
  try {
    console.log("[courseService] Unpublishing course:", courseId);

    // Check if course exists and belongs to instructor
    const course = await prisma.courses.findUnique({
      where: { Id: courseId },
      include: {
        Instructors: {
          select: {
            CreatorId: true,
          },
        },
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    if (course.Instructors.CreatorId !== instructorId) {
      throw new Error("You do not have permission to unpublish this course");
    }

    // Update course status
    const updatedCourse = await prisma.courses.update({
      where: { Id: courseId },
      data: {
        Status: "Draft",
        LastModificationTime: new Date(),
      },
    });

    console.log("[courseService] Course unpublished successfully:", courseId);
    return updatedCourse;
  } catch (error) {
    console.error("[courseService] Error unpublishing course:", error);
    throw error;
  }
};

// Get course by ID for instructor preview (allows Draft status)
export const getInstructorCourseById = async (courseId, instructorId) => {
  try {
    console.log(
      "[courseService] Fetching instructor course:",
      courseId,
      "for instructor:",
      instructorId,
    );

    const course = await prisma.courses.findFirst({
      where: {
        Id: courseId,
        InstructorId: instructorId, // Only owner can view
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
        ApprovalStatus: true,

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
            Index: true,
            CreationTime: true,
            Lectures: {
              select: {
                Id: true,
                Title: true,
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

    console.log(
      "[courseService] Instructor course found:",
      course ? "Yes" : "No",
    );

    if (!course) {
      throw new Error(
        "Course not found or you don't have permission to view it",
      );
    }

    return course;
  } catch (error) {
    console.error("[courseService] Error fetching instructor course:", error);
    throw error;
  }
};

// Update course by instructor
export const updateCourse = async (courseId, instructorId, courseData) => {
  try {
    const {
      title,
      description,
      intro,
      price,
      level,
      sections = [],
    } = courseData;

    console.log("[courseService] Updating course:", {
      courseId,
      instructorId,
      title,
      sectionCount: sections.length,
    });

    // Check if course exists (allow any instructor to update)
    const course = await prisma.courses.findFirst({
      where: {
        Id: courseId,
      },
      include: {
        Sections: {
          include: {
            Lectures: true,
          },
        },
      },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Update course basic information
    const updatedCourse = await prisma.courses.update({
      where: { Id: courseId },
      data: {
        ...(title && { Title: title }),
        ...(description !== undefined && { Description: description }),
        ...(intro !== undefined && { Intro: intro }),
        ...(price !== undefined && { Price: parseFloat(price) || 0 }),
        ...(level && { Level: level }),
        LastModifierId: instructorId,
        LastModificationTime: new Date(),
      },
    });

    // Handle sections update
    if (Array.isArray(sections) && sections.length > 0) {
      // Get current section IDs
      const currentSectionIds = course.Sections.map((s) => s.Id);
      const newSectionIds = sections
        .filter((s) => s.id) // Sections with existing IDs
        .map((s) => s.id);

      // Delete sections that are not in the update
      const sectionsToDelete = currentSectionIds.filter(
        (id) => !newSectionIds.includes(id),
      );

      if (sectionsToDelete.length > 0) {
        await prisma.sections.deleteMany({
          where: { Id: { in: sectionsToDelete } },
        });
        console.log(
          "[courseService] Deleted sections:",
          sectionsToDelete.length,
        );
      }

      // Update or create sections
      for (
        let sectionIndex = 0;
        sectionIndex < sections.length;
        sectionIndex++
      ) {
        const sectionData = sections[sectionIndex];

        if (sectionData.id) {
          // Update existing section
          const existingSection = course.Sections.find(
            (s) => s.Id === sectionData.id,
          );

          if (existingSection) {
            await prisma.sections.update({
              where: { Id: sectionData.id },
              data: {
                Title: sectionData.title || `Section ${sectionIndex + 1}`,
                Index: sectionIndex,
                LastModificationTime: new Date(),
              },
            });

            // Handle lectures in this section
            if (Array.isArray(sectionData.lectures)) {
              const currentLectureIds = existingSection.Lectures.map(
                (l) => l.Id,
              );
              const newLectureIds = sectionData.lectures
                .filter((l) => l.id)
                .map((l) => l.id);

              // Delete lectures that are not in the update
              const lecturesToDelete = currentLectureIds.filter(
                (id) => !newLectureIds.includes(id),
              );

              if (lecturesToDelete.length > 0) {
                await prisma.lectures.deleteMany({
                  where: { Id: { in: lecturesToDelete } },
                });
                console.log(
                  "[courseService] Deleted lectures:",
                  lecturesToDelete.length,
                );
              }

              // Update or create lectures
              for (
                let lectureIndex = 0;
                lectureIndex < sectionData.lectures.length;
                lectureIndex++
              ) {
                const lectureData = sectionData.lectures[lectureIndex];

                if (lectureData.id) {
                  // Update existing lecture
                  await prisma.lectures.update({
                    where: { Id: lectureData.id },
                    data: {
                      Title: lectureData.title || `Lecture ${lectureIndex + 1}`,
                      Content: lectureData.description || "",
                      LastModificationTime: new Date(),
                    },
                  });
                } else {
                  // Create new lecture
                  await prisma.lectures.create({
                    data: {
                      Title: lectureData.title || `Lecture ${lectureIndex + 1}`,
                      Content: lectureData.description || "",
                      SectionId: sectionData.id,
                    },
                  });
                }
              }
            }
          }
        } else {
          // Create new section
          const newSection = await prisma.sections.create({
            data: {
              Title: sectionData.title || `Section ${sectionIndex + 1}`,
              Index: sectionIndex,
              CourseId: courseId,
            },
          });

          // Create lectures for new section
          if (Array.isArray(sectionData.lectures)) {
            for (
              let lectureIndex = 0;
              lectureIndex < sectionData.lectures.length;
              lectureIndex++
            ) {
              const lectureData = sectionData.lectures[lectureIndex];

              await prisma.lectures.create({
                data: {
                  Title: lectureData.title || `Lecture ${lectureIndex + 1}`,
                  Content: lectureData.description || "",
                  SectionId: newSection.Id,
                },
              });
            }
          }
        }
      }
    }

    // Fetch updated course with all related data
    const result = await prisma.courses.findUnique({
      where: { Id: courseId },
      include: {
        Sections: {
          include: {
            Lectures: true,
          },
          orderBy: {
            Index: "asc",
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
    });

    console.log("[courseService] Course updated successfully:", courseId);
    return result;
  } catch (error) {
    console.error("[courseService] Error updating course:", error);
    throw error;
  }
};

// Delete Course
export const deleteCourse = async (courseId, instructorId) => {
  try {
    console.log(
      `[courseService] deleteCourse - Course: ${courseId}, Instructor: ${instructorId}`,
    );

    // Check if course exists (allow any instructor to delete)
    const course = await prisma.courses.findUnique({
      where: { Id: courseId },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Removed instructor ownership check - any instructor can delete

    // Check if course has any enrollments
    const enrollmentCount = await prisma.enrollments.count({
      where: { CourseId: courseId },
    });

    if (enrollmentCount > 0) {
      throw new Error(
        "Cannot delete course with active enrollments. Please archive it instead.",
      );
    }

    // Delete related data in order (due to foreign key constraints)
    // 1. Delete lectures first
    const sections = await prisma.sections.findMany({
      where: { CourseId: courseId },
      select: { Id: true },
    });

    for (const section of sections) {
      await prisma.lectures.deleteMany({
        where: { SectionId: section.Id },
      });
    }

    // 2. Delete sections
    await prisma.sections.deleteMany({
      where: { CourseId: courseId },
    });

    // 3. Delete reviews
    await prisma.reviews.deleteMany({
      where: { CourseId: courseId },
    });

    // 4. Delete wishlist items
    await prisma.wishlist.deleteMany({
      where: { CourseId: courseId },
    });

    // 5. Finally delete the course
    await prisma.courses.delete({
      where: { Id: courseId },
    });

    console.log("[courseService] Course deleted successfully:", courseId);
    return { success: true, message: "Course deleted successfully" };
  } catch (error) {
    console.error("[courseService] Error deleting course:", error);
    throw error;
  }
};
