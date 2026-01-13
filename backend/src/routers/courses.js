import express from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Reviews
router.post('/:id/reviews', authenticateJWT, courseController.addReview);
router.get('/:id/reviews', courseController.getReviews);

// Get all categories
router.get('/categories', courseController.getCategories);

// Get all courses with optional filters
// Supports: categoryId, level, minPrice, maxPrice, search, page, limit
router.get('/', courseController.getCourses);

// Get single course by ID
router.get('/:id', courseController.getCourseById);

export default router;
