import * as courseService from "../services/courseService.js";
import * as reviewService from "../services/reviewService.js";
import prisma from "../lib/prisma.js";

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
    const course = await courseService.getCourseById(id);

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

// Get instructor's courses
export const getInstructorCourses = async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log("[getInstructorCourses] Fetching courses for userId:", userId);

    // Find instructor by CreatorId (userId)
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });

    console.log("[getInstructorCourses] Found instructor:", instructor?.Id);

    if (!instructor) {
      console.log(
        "[getInstructorCourses] No instructor found for userId:",
        userId,
      );
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        pages: 0,
      });
    }

    const { status = "all", page = 1, limit = 10 } = req.query;
    console.log("[getInstructorCourses] Query params:", {
      status,
      page,
      limit,
    });

    const result = await courseService.getInstructorCourses(instructor.Id, {
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    console.log("[getInstructorCourses] Result:", {
      total: result.total,
      dataLength: result.data.length,
    });

    // Serialize BigInt values
    const serializedResult = JSON.parse(
      JSON.stringify(result, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    res.json({
      success: true,
      ...serializedResult,
    });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get instructor stats
export const getInstructorStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find instructor by CreatorId (userId)
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });

    if (!instructor) {
      return res.status(200).json({
        success: true,
        data: {
          totalCourses: 0,
          publishedCourses: 0,
          totalStudents: 0,
          totalLectures: 0,
          totalRevenue: "0.00",
        },
      });
    }

    const stats = await courseService.getInstructorStats(instructor.Id);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get instructor stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Create Course
export const createCourse = async (req, res) => {
  try {
    const instructorId = req.user.userId;
    const { title, description, price, level, sections } = req.body;

    console.log(
      `[CourseController] createCourse - Instructor: ${instructorId}, Title: ${title}`,
    );

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Course title is required",
      });
    }

    if (!sections || sections.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one section is required",
      });
    }

    const courseData = {
      title: title.trim(),
      description: description || "",
      price: parseFloat(price) || 0,
      level: level || "Beginner",
      instructorId,
      sections: sections || [],
    };

    const course = await courseService.createCourse(courseData);

    // Convert BigInt to string for JSON serialization
    const serializedCourse = JSON.parse(
      JSON.stringify(course, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    res.status(201).json({
      success: true,
      data: serializedCourse,
      message: "Course created successfully",
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create course",
    });
  }
};
// Publish Course
export const publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.user.userId;

    console.log(
      `[CourseController] Publishing course ${id} by instructor ${instructorId}`,
    );

    const course = await courseService.publishCourse(id, instructorId);

    // Serialize BigInt values
    const serializedCourse = JSON.parse(
      JSON.stringify(course, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    res.json({
      success: true,
      data: serializedCourse,
      message: "Course published successfully and is now visible to students",
    });
  } catch (error) {
    console.error("Publish course error:", error);
    res.status(error.message.includes("permission") ? 403 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

// Unpublish Course
export const unpublishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.user.userId;

    console.log(
      `[CourseController] Unpublishing course ${id} by instructor ${instructorId}`,
    );

    const course = await courseService.unpublishCourse(id, instructorId);

    // Serialize BigInt values
    const serializedCourse = JSON.parse(
      JSON.stringify(course, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    res.json({
      success: true,
      data: serializedCourse,
      message: "Course unpublished and hidden from students",
    });
  } catch (error) {
    console.error("Unpublish course error:", error);
    res.status(error.message.includes("permission") ? 403 : 500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get instructor's course by ID (for preview, allows Draft status)
export const getInstructorCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log(
      `[CourseController] Fetching instructor course ${id} for user ${userId}`,
    );

    // Find instructor by CreatorId
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: userId },
    });

    if (!instructor) {
      return res.status(403).json({
        success: false,
        error: "You are not an instructor",
      });
    }

    const course = await courseService.getInstructorCourseById(
      id,
      instructor.Id,
    );

    // Serialize BigInt values
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
    console.error("Get instructor course error:", error);
    res.status(error.message.includes("permission") ? 403 : 404).json({
      success: false,
      error: error.message,
    });
  }
};

// Update Course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.user.userId;
    const { title, description, intro, price, level, sections } = req.body;

    console.log(
      `[CourseController] updateCourse - Course: ${id}, Instructor: ${instructorId}`,
    );

    // Validation
    if (!title && !description && !intro && !price && !level && !sections) {
      return res.status(400).json({
        success: false,
        error: "At least one field must be provided to update",
      });
    }

    const courseData = {
      ...(title && { title: title.trim() }),
      ...(description !== undefined && { description }),
      ...(intro !== undefined && { intro }),
      ...(price !== undefined && { price: parseFloat(price) || 0 }),
      ...(level && { level }),
      ...(sections && { sections }),
    };

    // Find instructor by CreatorId
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: instructorId },
    });

    if (!instructor) {
      return res.status(403).json({
        success: false,
        error: "You are not an instructor",
      });
    }

    const updatedCourse = await courseService.updateCourse(
      id,
      instructor.Id,
      courseData,
    );

    // Convert BigInt to string for JSON serialization
    const serializedCourse = JSON.parse(
      JSON.stringify(updatedCourse, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    );

    res.json({
      success: true,
      data: serializedCourse,
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(error.message.includes("permission") ? 403 : 500).json({
      success: false,
      error: error.message || "Failed to update course",
    });
  }
};

// Delete Course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.user.userId;

    console.log(
      `[CourseController] deleteCourse - Course: ${id}, Instructor: ${instructorId}`,
    );

    // Find instructor by CreatorId
    const instructor = await prisma.instructors.findFirst({
      where: { CreatorId: instructorId },
    });

    if (!instructor) {
      return res.status(403).json({
        success: false,
        error: "You are not an instructor",
      });
    }

    const result = await courseService.deleteCourse(id, instructor.Id);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Delete course error:", error);
    const statusCode = error.message.includes("permission")
      ? 403
      : error.message.includes("not found")
        ? 404
        : error.message.includes("enrollments")
          ? 400
          : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || "Failed to delete course",
    });
  }
};
