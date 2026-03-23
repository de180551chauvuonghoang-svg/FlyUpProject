import * as courseService from "../services/courseService.js";
import * as reviewService from "../services/reviewService.js";
import { safeDel } from "../lib/cache.js";

// Add Review
export const addReview = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { rating, content } = req.body;
    const userId = req.user.userId; // From authMiddleware

    console.log(
      `[CourseController] addReview Request - User: ${userId}, Course: ${courseId}, Body:`,
      req.body,
    );

    const review = await reviewService.createReview(userId, courseId, {
      rating,
      content,
    });

    // Serialize BigInt if any (though review mostly uses Int/String)
    const serializedReview = JSON.parse(
      JSON.stringify(review, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    res.status(201).json({
      success: true,
      data: serializedReview,
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get Reviews
export const getReviews = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { page, limit } = req.query;

    const result = await reviewService.getCourseReviews(
      courseId,
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reviews",
    });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const categories = await courseService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
      message: error.message,
    });
  }
};

// Get courses with filters
export const getCourses = async (req, res) => {
  try {
    const {
      categoryId,
      level,
      minPrice,
      maxPrice,
      search,
      page,
      limit,
      sortBy,
    } = req.query;

    const filters = {
      categoryId,
      level,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 24,
      sortBy,
    };

    const result = await courseService.getCourses(filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch courses",
      message: error.message,
    });
  }
};

// Get single course by ID
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    // If user is authenticated (via optionalAuthenticateJWT), skip status filter
    // so instructors can view/edit their draft/pending courses
    const skipStatusFilter = !!req.user;
    const course = await courseService.getCourseById(id, { skipStatusFilter });

    // Convert BigInt to string for JSON serialization
    const serializedCourse = JSON.parse(
      JSON.stringify(course, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    res.json({
      success: true,
      data: serializedCourse,
    });
  } catch (error) {
    console.error("Get course error:", error);
    if (error.message === "Course not found") {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to fetch course",
      message: error.message,
    });
  }
};

// Get instructor's course stats (for dashboard)
export const getInstructorStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const prisma = (await import("../lib/prisma.js")).default;

    // Find instructor record from user
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });

    if (!instructor) {
      return res.json({
        success: true,
        data: {
          totalCourses: 0,
          totalStudents: 0,
          totalRevenue: 0,
          avgRating: 0,
          pendingCourses: 0,
          approvedCourses: 0,
        },
      });
    }

    const courses = await prisma.courses.findMany({
      where: { InstructorId: instructor.Id },
      select: {
        Id: true,
        LearnerCount: true,
        RatingCount: true,
        TotalRating: true,
        Price: true,
        ApprovalStatus: true,
      },
    });

    const totalStudents = courses.reduce(
      (sum, c) => sum + (c.LearnerCount || 0),
      0,
    );
    const totalRevenue = courses.reduce(
      (sum, c) => sum + (c.LearnerCount || 0) * (c.Price || 0),
      0,
    );
    const totalRatingCount = courses.reduce(
      (sum, c) => sum + (c.RatingCount || 0),
      0,
    );
    const totalRatingSum = courses.reduce(
      (sum, c) => sum + Number(c.TotalRating || 0),
      0,
    );
    const avgRating =
      totalRatingCount > 0 ? (totalRatingSum / totalRatingCount).toFixed(1) : 0;
    const pendingCourses = courses.filter(
      (c) => c.ApprovalStatus === "Pending",
    ).length;
    const approvedCourses = courses.filter(
      (c) => c.ApprovalStatus === "APPROVED",
    ).length;

    res.json({
      success: true,
      data: {
        totalCourses: courses.length,
        totalStudents,
        totalRevenue: Math.round(totalRevenue),
        avgRating: parseFloat(avgRating),
        pendingCourses,
        approvedCourses,
      },
    });
  } catch (error) {
    console.error("Get instructor stats error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
};

// Get courses belonging to logged-in instructor
export const getInstructorCourses = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = "all" } = req.query;
    const prisma = (await import("../lib/prisma.js")).default;

    // Find instructor record
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });

    if (!instructor) {
      return res.json({ success: true, data: [] });
    }

    const where = { InstructorId: instructor.Id };
    if (status && status !== "all") {
      where.ApprovalStatus = status;
    }

    const courses = await prisma.courses.findMany({
      where,
      select: {
        Id: true,
        Title: true,
        ThumbUrl: true,
        Price: true,
        Discount: true,
        Level: true,
        Status: true,
        ApprovalStatus: true,
        LearnerCount: true,
        RatingCount: true,
        TotalRating: true,
        LectureCount: true,
        CreationTime: true,
        Categories: {
          select: { Id: true, Title: true },
        },
      },
      orderBy: { CreationTime: "desc" },
    });

    const serialized = JSON.parse(
      JSON.stringify(courses, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    const transformed = serialized.map((c) => ({
      id: c.Id,
      title: c.Title,
      thumbnail: c.ThumbUrl || "",
      price: c.Price,
      discount: c.Discount,
      level: c.Level,
      status: c.Status,
      approvalStatus: c.ApprovalStatus,
      students: c.LearnerCount,
      lectures: c.LectureCount,
      rating:
        c.RatingCount > 0
          ? (Number(c.TotalRating) / c.RatingCount).toFixed(1)
          : 0,
      ratingCount: c.RatingCount,
      category: c.Categories?.Title || "",
      createdAt: c.CreationTime,
    }));

    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch instructor courses" });
  }
};

// ─── CREATE COURSE ─────────────────────────────────────────────────────────
export const createCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const prisma = (await import("../lib/prisma.js")).default;

    // Find instructor record
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    if (!instructor) {
      return res
        .status(403)
        .json({
          success: false,
          error: "Instructor profile not found. Please contact admin.",
        });
    }

    const {
      title,
      description,
      intro,
      price,
      discount,
      level,
      category,
      sections,
    } = req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Course title is required" });
    }

    // Find default category if not provided
    let categoryId = category;
    if (!categoryId) {
      const defaultCat = await prisma.categories.findFirst({
        where: { IsLeaf: true },
        orderBy: { Title: "asc" },
      });
      categoryId = defaultCat?.Id;
    }
    if (!categoryId) {
      return res
        .status(400)
        .json({
          success: false,
          error: "No category found. Please select a category.",
        });
    }

    // Create course with sections & lectures in a transaction
    const course = await prisma.$transaction(async (tx) => {
      const newCourse = await tx.courses.create({
        data: {
          Title: title.trim(),
          MetaTitle: title.trim(),
          Description: description || "",
          Intro: intro || description?.substring(0, 500) || "",
          Price: parseFloat(price) || 0,
          Discount: parseFloat(discount) || 0,
          Level: level || "Beginner",
          Status: "Draft",
          ApprovalStatus: "Pending",
          LeafCategoryId: categoryId,
          InstructorId: instructor.Id,
          CreatorId: userId,
          LastModifierId: userId,
        },
      });

      // Create sections and lectures if provided
      if (sections && sections.length > 0) {
        for (let i = 0; i < sections.length; i++) {
          const sec = sections[i];
          const newSection = await tx.sections.create({
            data: {
              Title: sec.title || `Section ${i + 1}`,
              Index: i,
              CourseId: newCourse.Id,
            },
          });

          if (sec.lectures && sec.lectures.length > 0) {
            for (let j = 0; j < sec.lectures.length; j++) {
              const lec = sec.lectures[j];
              await tx.lectures.create({
                data: {
                  Title: lec.title || `Lecture ${j + 1}`,
                  Content: lec.content || "",
                  SectionId: newSection.Id,
                },
              });
            }
            // Update section lecture count
            await tx.sections.update({
              where: { Id: newSection.Id },
              data: { LectureCount: sec.lectures.length },
            });
          }
        }
        // Update course lecture count
        const totalLectures = sections.reduce(
          (sum, s) => sum + (s.lectures?.length || 0),
          0,
        );
        await tx.courses.update({
          where: { Id: newCourse.Id },
          data: { LectureCount: totalLectures },
        });
      }

      return newCourse;
    });

    res.status(201).json({
      success: true,
      message:
        "Course created successfully! It will be reviewed by admin before publishing.",
      data: {
        id: course.Id,
        title: course.Title,
        status: course.Status,
        approvalStatus: course.ApprovalStatus,
      },
    });
  } catch (error) {
    console.error("Create course error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to create course",
        message: error.message,
      });
  }
};

// ─── DELETE COURSE ─────────────────────────────────────────────────────────
export const deleteCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: courseId } = req.params;
    const prisma = (await import("../lib/prisma.js")).default;

    // Try to find via Instructors table first, then fallback to CreatorId
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    const courseWhere = instructor
      ? { Id: courseId, InstructorId: instructor.Id }
      : { Id: courseId, CreatorId: userId };

    const course = await prisma.courses.findFirst({ where: courseWhere });
    if (!course)
      return res
        .status(404)
        .json({ success: false, error: "Course not found or access denied" });

    await prisma.courses.delete({ where: { Id: courseId } });

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to delete course",
        message: error.message,
      });
  }
};

// ─── PUBLISH COURSE ─────────────────────────────────────────────────────────
export const publishCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: courseId } = req.params;
    const prisma = (await import("../lib/prisma.js")).default;

    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    const courseWhere = instructor
      ? { Id: courseId, InstructorId: instructor.Id }
      : { Id: courseId, CreatorId: userId };

    const course = await prisma.courses.findFirst({ where: courseWhere });
    if (!course)
      return res
        .status(404)
        .json({ success: false, error: "Course not found or access denied" });

    const updated = await prisma.courses.update({
      where: { Id: courseId },
      data: { Status: "Ongoing", ApprovalStatus: "APPROVED" },
    });

    res.json({
      success: true,
      message: "Course published successfully!",
      data: { status: updated.Status },
    });
  } catch (error) {
    console.error("Publish course error:", error);
    res.status(500).json({ success: false, error: "Failed to publish course" });
  }
};

// ─── UNPUBLISH COURSE ─────────────────────────────────────────────────────────
export const unpublishCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: courseId } = req.params;
    const prisma = (await import("../lib/prisma.js")).default;

    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    const courseWhereUnpub = instructor
      ? { Id: courseId, InstructorId: instructor.Id }
      : { Id: courseId, CreatorId: userId };

    const course = await prisma.courses.findFirst({ where: courseWhereUnpub });
    if (!course)
      return res
        .status(404)
        .json({ success: false, error: "Course not found or access denied" });

    const updated = await prisma.courses.update({
      where: { Id: courseId },
      data: { Status: "Draft" },
    });

    res.json({
      success: true,
      message: "Course unpublished.",
      data: { status: updated.Status },
    });
  } catch (error) {
    console.error("Unpublish course error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to unpublish course" });
  }
};

// ─── UPDATE COURSE ─────────────────────────────────────────────────────────
export const updateCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: courseId } = req.params;
    const prisma = (await import("../lib/prisma.js")).default;

    // Verify ownership with CreatorId fallback
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    const courseWhereUpd = instructor
      ? { Id: courseId, InstructorId: instructor.Id }
      : { Id: courseId, CreatorId: userId };

    const course = await prisma.courses.findFirst({ where: courseWhereUpd });
    if (!course)
      return res
        .status(404)
        .json({ success: false, error: "Course not found or access denied" });

    const { title, description, intro, price, discount, level } = req.body;

    const updated = await prisma.courses.update({
      where: { Id: courseId },
      data: {
        ...(title && { Title: title.trim(), MetaTitle: title.trim() }),
        ...(description !== undefined && { Description: description }),
        ...(intro !== undefined && { Intro: intro }),
        ...(price !== undefined && { Price: parseFloat(price) || 0 }),
        ...(discount !== undefined && { Discount: parseFloat(discount) || 0 }),
        ...(level && { Level: level }),
        LastModifierId: userId,
      },
    });

    // Invalidate course cache
    await safeDel(`course:${courseId}`);
    console.log(`[Cache] Invalidated cache for course: ${courseId}`);

    res.json({
      success: true,
      message: "Course updated successfully!",
      data: { id: updated.Id, title: updated.Title },
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ success: false, error: "Failed to update course" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//                          SECTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// ─── CREATE SECTION ─────────────────────────────────────────────────────────
export const createSection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    const { title } = req.body;
    const prisma = (await import("../lib/prisma.js")).default;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Section title is required" });
    }

    // Verify ownership
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    const courseWhere = instructor
      ? { Id: courseId, InstructorId: instructor.Id }
      : { Id: courseId, CreatorId: userId };

    const course = await prisma.courses.findFirst({ where: courseWhere });
    if (!course)
      return res
        .status(404)
        .json({ success: false, error: "Course not found or access denied" });

    // Get max index for ordering
    const maxSection = await prisma.sections.findFirst({
      where: { CourseId: courseId },
      orderBy: { Index: "desc" },
    });

    const newSection = await prisma.sections.create({
      data: {
        Title: title.trim(),
        Index: (maxSection?.Index ?? -1) + 1,
        CourseId: courseId,
        LectureCount: 0,
      },
    });

    // Invalidate course cache
    await safeDel(`course:${courseId}`);

    res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: newSection,
    });
  } catch (error) {
    console.error("Create section error:", error);
    res.status(500).json({ success: false, error: "Failed to create section" });
  }
};

// ─── UPDATE SECTION ─────────────────────────────────────────────────────────
export const updateSection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sectionId } = req.params;
    const { title } = req.body;
    const prisma = (await import("../lib/prisma.js")).default;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Section title is required" });
    }

    // Verify section exists and user owns the course
    const section = await prisma.sections.findUnique({
      where: { Id: sectionId },
      include: { Courses: true },
    });

    if (!section)
      return res
        .status(404)
        .json({ success: false, error: "Section not found" });

    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    const hasAccess = instructor
      ? section.Courses.InstructorId === instructor.Id
      : section.Courses.CreatorId === userId;

    if (!hasAccess)
      return res.status(403).json({ success: false, error: "Access denied" });

    const updated = await prisma.sections.update({
      where: { Id: sectionId },
      data: { Title: title.trim() },
    });

    // Invalidate course cache
    await safeDel(`course:${section.CourseId}`);

    res.json({
      success: true,
      message: "Section updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update section error:", error);
    res.status(500).json({ success: false, error: "Failed to update section" });
  }
};

// ─── DELETE SECTION ─────────────────────────────────────────────────────────
export const deleteSection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sectionId } = req.params;
    const prisma = (await import("../lib/prisma.js")).default;

    const section = await prisma.sections.findUnique({
      where: { Id: sectionId },
      include: { Courses: true, Lectures: true },
    });

    if (!section)
      return res
        .status(404)
        .json({ success: false, error: "Section not found" });

    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    const hasAccess = instructor
      ? section.Courses.InstructorId === instructor.Id
      : section.Courses.CreatorId === userId;

    if (!hasAccess)
      return res.status(403).json({ success: false, error: "Access denied" });

    // Delete section and related lectures in transaction
    await prisma.$transaction(async (tx) => {
      // Delete all lecture materials first
      const lectureIds = section.Lectures.map((l) => l.Id);
      if (lectureIds.length > 0) {
        await tx.lectureMaterial.deleteMany({
          where: { LectureId: { in: lectureIds } },
        });
      }

      // Delete all lectures
      await tx.lectures.deleteMany({
        where: { SectionId: sectionId },
      });

      // Delete section
      await tx.sections.delete({
        where: { Id: sectionId },
      });

      // Update course lecture count
      const remainingSections = await tx.sections.findMany({
        where: { CourseId: section.CourseId },
        include: { Lectures: true },
      });
      const totalLectures = remainingSections.reduce(
        (sum, s) => sum + s.Lectures.length,
        0,
      );
      await tx.courses.update({
        where: { Id: section.CourseId },
        data: { LectureCount: totalLectures },
      });
    });

    // Invalidate course cache
    await safeDel(`course:${section.CourseId}`);

    res.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error("Delete section error:", error);
    res.status(500).json({ success: false, error: "Failed to delete section" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//                          LECTURE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

// ─── CREATE LECTURE ─────────────────────────────────────────────────────────
export const createLecture = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sectionId } = req.params;
    const { title, content } = req.body;
    const prisma = (await import("../lib/prisma.js")).default;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Lecture title is required" });
    }

    // Verify section exists and user owns the course
    const section = await prisma.sections.findUnique({
      where: { Id: sectionId },
      include: { Courses: true },
    });

    if (!section)
      return res
        .status(404)
        .json({ success: false, error: "Section not found" });

    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    const hasAccess = instructor
      ? section.Courses.InstructorId === instructor.Id
      : section.Courses.CreatorId === userId;

    if (!hasAccess)
      return res.status(403).json({ success: false, error: "Access denied" });

    const newLecture = await prisma.$transaction(async (tx) => {
      const lecture = await tx.lectures.create({
        data: {
          Title: title.trim(),
          Content: content || "",
          SectionId: sectionId,
        },
      });

      // Update section lecture count
      const lectureCount = await tx.lectures.count({
        where: { SectionId: sectionId },
      });
      await tx.sections.update({
        where: { Id: sectionId },
        data: { LectureCount: lectureCount },
      });

      // Update course lecture count
      const sections = await tx.sections.findMany({
        where: { CourseId: section.CourseId },
      });
      const totalLectures = sections.reduce(
        (sum, s) => sum + (s.LectureCount || 0),
        0,
      );
      await tx.courses.update({
        where: { Id: section.CourseId },
        data: { LectureCount: totalLectures },
      });

      return lecture;
    });

    // Invalidate course cache
    await safeDel(`course:${section.CourseId}`);

    res.status(201).json({
      success: true,
      message: "Lecture created successfully",
      data: newLecture,
    });
  } catch (error) {
    console.error("Create lecture error:", error);
    res.status(500).json({ success: false, error: "Failed to create lecture" });
  }
};

// ─── UPDATE LECTURE ─────────────────────────────────────────────────────────
export const updateLecture = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { lectureId } = req.params;
    const { title, content } = req.body;
    const prisma = (await import("../lib/prisma.js")).default;

    // Verify lecture exists and user owns the course
    const lecture = await prisma.lectures.findUnique({
      where: { Id: lectureId },
      include: {
        Sections: {
          include: { Courses: true },
        },
      },
    });

    if (!lecture)
      return res
        .status(404)
        .json({ success: false, error: "Lecture not found" });

    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    const hasAccess = instructor
      ? lecture.Sections.Courses.InstructorId === instructor.Id
      : lecture.Sections.Courses.CreatorId === userId;

    if (!hasAccess)
      return res.status(403).json({ success: false, error: "Access denied" });

    const updated = await prisma.lectures.update({
      where: { Id: lectureId },
      data: {
        ...(title && { Title: title.trim() }),
        ...(content !== undefined && { Content: content }),
      },
    });

    // Invalidate course cache
    const courseId = lecture.Sections.Courses.Id;
    await safeDel(`course:${courseId}`);

    res.json({
      success: true,
      message: "Lecture updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update lecture error:", error);
    res.status(500).json({ success: false, error: "Failed to update lecture" });
  }
};

// ─── DELETE LECTURE ─────────────────────────────────────────────────────────
export const deleteLecture = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { lectureId } = req.params;
    const prisma = (await import("../lib/prisma.js")).default;

    const lecture = await prisma.lectures.findUnique({
      where: { Id: lectureId },
      include: {
        Sections: {
          include: { Courses: true },
        },
      },
    });

    if (!lecture)
      return res
        .status(404)
        .json({ success: false, error: "Lecture not found" });

    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    const hasAccess = instructor
      ? lecture.Sections.Courses.InstructorId === instructor.Id
      : lecture.Sections.Courses.CreatorId === userId;

    if (!hasAccess)
      return res.status(403).json({ success: false, error: "Access denied" });

    await prisma.$transaction(async (tx) => {
      // Delete lecture materials
      await tx.lectureMaterial.deleteMany({
        where: { LectureId: lectureId },
      });

      // Delete lecture
      await tx.lectures.delete({
        where: { Id: lectureId },
      });

      // Update section lecture count
      const lectureCount = await tx.lectures.count({
        where: { SectionId: lecture.SectionId },
      });
      await tx.sections.update({
        where: { Id: lecture.SectionId },
        data: { LectureCount: lectureCount },
      });

      // Update course lecture count
      const sections = await tx.sections.findMany({
        where: { CourseId: lecture.Sections.CourseId },
      });
      const totalLectures = sections.reduce(
        (sum, s) => sum + (s.LectureCount || 0),
        0,
      );
      await tx.courses.update({
        where: { Id: lecture.Sections.CourseId },
        data: { LectureCount: totalLectures },
      });
    });

    // Invalidate course cache
    await safeDel(`course:${lecture.Sections.CourseId}`);

    res.json({
      success: true,
      message: "Lecture deleted successfully",
    });
  } catch (error) {
    console.error("Delete lecture error:", error);
    res.status(500).json({ success: false, error: "Failed to delete lecture" });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
//                    INSTRUCTOR STUDENTS & COMMUNICATION
// ═══════════════════════════════════════════════════════════════════════════

// ─── GET INSTRUCTOR STUDENTS ────────────────────────────────────────────────
export const getInstructorStudents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.query;
    const prisma = (await import("../lib/prisma.js")).default;

    // Find instructor record
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    if (!instructor) {
      return res.json({ success: true, data: [] });
    }

    // Get instructor's courses
    const coursesWhere = { InstructorId: instructor.Id };
    if (courseId) {
      coursesWhere.Id = courseId;
    }
    const courses = await prisma.courses.findMany({
      where: coursesWhere,
      select: {
        Id: true,
        Title: true,
        LectureCount: true,
      },
    });
    const courseIds = courses.map((c) => c.Id);
    const courseMap = Object.fromEntries(courses.map((c) => [c.Id, c]));

    if (courseIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get enrollments with user data
    const enrollments = await prisma.enrollments.findMany({
      where: {
        CourseId: { in: courseIds },
        Status: "Active",
      },
      include: {
        Users: {
          select: {
            Id: true,
            FullName: true,
            Email: true,
            AvatarUrl: true,
          },
        },
      },
    });

    // Calculate progress for each student
    const students = enrollments.map((enrollment) => {
      const course = courseMap[enrollment.CourseId];
      // Parse LectureMilestones to count completed lectures
      let lecturesCompleted = 0;
      try {
        const milestones = JSON.parse(enrollment.LectureMilestones || "[]");
        lecturesCompleted = Array.isArray(milestones) ? milestones.length : 0;
      } catch (e) {
        lecturesCompleted = 0;
      }
      const totalLectures = course?.LectureCount || 1;
      const completionPercent = Math.min(
        100,
        Math.round((lecturesCompleted / totalLectures) * 100)
      );

      return {
        userId: enrollment.Users.Id,
        courseId: enrollment.CourseId,
        name: enrollment.Users.FullName,
        email: enrollment.Users.Email,
        avatar: enrollment.Users.AvatarUrl || "",
        courseTitle: course?.Title || "Unknown",
        enrolledAt: enrollment.CreationTime,
        lecturesCompleted,
        totalLectures,
        completionPercent,
      };
    });

    res.json({ success: true, data: students });
  } catch (error) {
    console.error("Get instructor students error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch students" });
  }
};

// ─── EXPORT STUDENT RESULTS TO EXCEL ────────────────────────────────────────
export const exportStudentResults = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.query;
    const prisma = (await import("../lib/prisma.js")).default;
    const xlsxModule = await import("xlsx");
    const XLSX = xlsxModule.default || xlsxModule;

    // Find instructor record
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    if (!instructor) {
      return res.status(404).json({ success: false, error: "Instructor not found" });
    }

    // Get instructor's courses
    const coursesWhere = { InstructorId: instructor.Id };
    if (courseId) {
      coursesWhere.Id = courseId;
    }
    const courses = await prisma.courses.findMany({
      where: coursesWhere,
      select: { Id: true, Title: true, LectureCount: true },
    });
    const courseIds = courses.map((c) => c.Id);
    const courseMap = Object.fromEntries(courses.map((c) => [c.Id, c]));

    if (courseIds.length === 0) {
      return res.status(404).json({ success: false, error: "No courses found" });
    }

    // Get enrollments
    const enrollments = await prisma.enrollments.findMany({
      where: { CourseId: { in: courseIds }, Status: "Active" },
      include: {
        Users: {
          select: { FullName: true, Email: true },
        },
      },
    });

    // Build spreadsheet rows
    const rows = enrollments.map((enrollment) => {
      const course = courseMap[enrollment.CourseId];
      let lecturesCompleted = 0;
      try {
        const milestones = JSON.parse(enrollment.LectureMilestones || "[]");
        lecturesCompleted = Array.isArray(milestones) ? milestones.length : 0;
      } catch (e) {
        lecturesCompleted = 0;
      }
      const totalLectures = course?.LectureCount || 0;
      const completionPercent = totalLectures > 0
        ? Math.min(100, Math.round((lecturesCompleted / totalLectures) * 100))
        : 0;

      return {
        "Student Name": enrollment.Users.FullName,
        "Email": enrollment.Users.Email,
        "Course": course?.Title || "Unknown",
        "Enrolled Date": new Date(enrollment.CreationTime).toLocaleDateString(),
        "Lectures Completed": `${lecturesCompleted}/${totalLectures}`,
        "Completion %": `${completionPercent}%`,
      };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ "Student Name": "No data", Email: "", Course: "", "Enrolled Date": "", "Lectures Completed": "", "Completion %": "" }]);

    // Set column widths
    ws["!cols"] = [
      { wch: 25 }, // Student Name
      { wch: 30 }, // Email
      { wch: 40 }, // Course
      { wch: 15 }, // Enrolled Date
      { wch: 20 }, // Lectures Completed
      { wch: 15 }, // Completion %
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Student Results");

    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    res.setHeader("Content-Disposition", 'attachment; filename="student_results.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Export student results error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to export student results" });
  }
};

// ─── GET INSTRUCTOR COMMUNICATION ───────────────────────────────────────────
export const getInstructorCommunication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const prisma = (await import("../lib/prisma.js")).default;

    // Find instructor record
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });
    if (!instructor) {
      return res.json({ success: true, data: { comments: [], reviews: [] } });
    }

    // Get instructor's courses
    const courses = await prisma.courses.findMany({
      where: { InstructorId: instructor.Id },
      select: {
        Id: true,
        Title: true,
        Sections: {
          select: {
            Lectures: {
              select: { Id: true, Title: true },
            },
          },
        },
      },
    });
    const courseIds = courses.map((c) => c.Id);

    // Build lecture → course/lecture title map
    const lectureMap = {};
    courses.forEach((course) => {
      course.Sections?.forEach((section) => {
        section.Lectures?.forEach((lecture) => {
          lectureMap[lecture.Id] = {
            lectureTitle: lecture.Title,
            courseTitle: course.Title,
          };
        });
      });
    });

    const lectureIds = Object.keys(lectureMap);

    // Fetch comments on instructor's lectures
    const comments = lectureIds.length > 0
      ? await prisma.comments.findMany({
          where: {
            LectureId: { in: lectureIds },
            ParentId: null,
          },
          include: {
            Users: {
              select: { Id: true, FullName: true, AvatarUrl: true },
            },
          },
          orderBy: { CreationTime: "desc" },
          take: 50,
        })
      : [];

    // Fetch reviews on instructor's courses
    const reviews = courseIds.length > 0
      ? await prisma.courseReviews.findMany({
          where: { CourseId: { in: courseIds } },
          include: {
            Users: {
              select: { Id: true, FullName: true, AvatarUrl: true },
            },
          },
          orderBy: { CreationTime: "desc" },
          take: 50,
        })
      : [];

    // Transform
    const transformedComments = comments.map((c) => {
      const info = lectureMap[c.LectureId] || {};
      return {
        id: c.Id,
        content: c.Content,
        createdAt: c.CreationTime,
        user: {
          id: c.Users.Id,
          name: c.Users.FullName,
          avatar: c.Users.AvatarUrl || "",
        },
        lectureTitle: info.lectureTitle || "",
        courseTitle: info.courseTitle || "",
      };
    });

    const courseMap2 = Object.fromEntries(courses.map((c) => [c.Id, c.Title]));
    const transformedReviews = reviews.map((r) => ({
      id: r.Id,
      Content: r.Content,
      Rating: r.Rating,
      CreationTime: r.CreationTime,
      user: {
        id: r.Users.Id,
        FullName: r.Users.FullName,
        AvatarUrl: r.Users.AvatarUrl || "",
      },
      courseTitle: courseMap2[r.CourseId] || "",
    }));

    res.json({
      success: true,
      data: {
        comments: transformedComments,
        reviews: transformedReviews,
      },
    });
  } catch (error) {
    console.error("Get instructor communication error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch communication data" });
  }
};
