import express from 'express';
import * as courseController from '../controllers/courseController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management API
 */

/**
 * @swagger
 * /courses/{id}/reviews:
 *   post:
 *     summary: Add a review to a course
 *     tags: [Courses]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - content
 *             properties:
 *               rating:
 *                 type: integer
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review added successfully
 *       400:
 *         description: Invalid input
 */
router.post('/:id/reviews', authenticateJWT, courseController.addReview);

/**
 * @swagger
 * /courses/{id}/reviews:
 *   get:
 *     summary: Get reviews for a course
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/:id/reviews', courseController.getReviews);

/**
 * @swagger
 * /courses/categories:
 *   get:
 *     summary: Get all course categories
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', courseController.getCategories);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses with optional filters
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of courses
 */
router.get('/', courseController.getCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get single course by ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details
 *       404:
 *         description: Course not found
 */
router.get('/:id', courseController.getCourseById);

export default router;
