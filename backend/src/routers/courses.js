import express from "express";
import * as courseController from "../controllers/courseController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create course - MUST come before /:id route
router.post("/create", authenticateJWT, courseController.createCourse);

// Update course - MUST come before /:id route
router.put("/:id/update", authenticateJWT, courseController.updateCourse);

// Delete course - MUST come before /:id route
router.delete("/:id", authenticateJWT, courseController.deleteCourse);

// Publish/Unpublish course - MUST come before /:id route
router.put("/:id/publish", authenticateJWT, courseController.publishCourse);
router.put("/:id/unpublish", authenticateJWT, courseController.unpublishCourse);

// Get all categories - MUST come before /:id route
router.get("/categories", courseController.getCategories);

// Instructor routes - MUST come before /:id route
router.get(
  "/instructor/courses",
  authenticateJWT,
  courseController.getInstructorCourses,
);
router.get(
  "/instructor/stats",
  authenticateJWT,
  courseController.getInstructorStats,
);
router.get(
  "/instructor/course/:id",
  authenticateJWT,
  courseController.getInstructorCourseById,
);

// Reviews
router.post("/:id/reviews", authenticateJWT, courseController.addReview);
router.get("/:id/reviews", courseController.getReviews);

// Get all courses with optional filters
// Supports: categoryId, level, minPrice, maxPrice, search, page, limit
router.get("/", courseController.getCourses);

// Get single course by ID - MUST come last
router.get("/:id", courseController.getCourseById);

export default router;
