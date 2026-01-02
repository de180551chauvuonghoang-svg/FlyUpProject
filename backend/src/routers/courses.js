import express from 'express';
import * as courseController from '../controllers/courseController.js';

const router = express.Router();

// Get all categories
router.get('/categories', courseController.getCategories);

// Get all courses with optional filters
// Supports: categoryId, level, minPrice, maxPrice, search, page, limit
router.get('/', courseController.getCourses);

// Get single course by ID
router.get('/:id', courseController.getCourseById);

export default router;
