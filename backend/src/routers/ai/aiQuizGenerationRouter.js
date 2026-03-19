/**
 * AI Quiz Generation Router
 *
 * Routes for adaptive quiz generation API
 * Phase 5: API Controller & Router Implementation
 */

import express from 'express';
import { generateQuiz, getQuizGenerationHealth } from '../../controllers/ai/aiQuizGenerationController.js';
import { authenticateJWT } from '../../middleware/authMiddleware.js';
import { rateLimit } from '../../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Quiz Generation
 *   description: AI-powered adaptive quiz generation
 */

/**
 * @swagger
 * /api/ai/quiz/health:
 *   get:
 *     summary: Health check for quiz generation service
 *     tags: [Quiz Generation]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 service:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 database:
 *                   type: object
 *                 cache:
 *                   type: object
 *       503:
 *         description: Service is unhealthy
 */
router.get('/health', getQuizGenerationHealth);

/**
 * @swagger
 * /api/ai/quiz/generate:
 *   post:
 *     summary: Generate adaptive quiz
 *     tags: [Quiz Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - courseId
 *               - scope
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID to generate quiz for
 *               courseId:
 *                 type: string
 *                 format: uuid
 *                 description: Course ID
 *               scope:
 *                 type: object
 *                 required:
 *                   - type
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [entire_course, specific_sections, weak_areas]
 *                     description: Quiz scope type
 *                   sectionIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: uuid
 *                     description: Section IDs (required for specific_sections)
 *                   weakAreaThreshold:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     default: 0.6
 *                     description: Threshold for weak areas (for weak_areas scope)
 *                   includeZeroProgress:
 *                     type: boolean
 *                     default: true
 *                     description: Include sections with no progress (for weak_areas scope)
 *               questionCount:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 description: Number of questions to generate
 *               options:
 *                 type: object
 *                 description: Additional generation options
 *     responses:
 *       200:
 *         description: Quiz generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 quizId:
 *                   type: string
 *                   format: uuid
 *                 assignmentId:
 *                   type: string
 *                   format: uuid
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     userTheta:
 *                       type: number
 *                       description: User ability level
 *                     difficultyMix:
 *                       type: object
 *                       description: Difficulty distribution
 *                     selectionMethod:
 *                       type: string
 *                     catQuestions:
 *                       type: integer
 *                       description: Number of CAT-selected questions
 *                     difficultyBasedQuestions:
 *                       type: integer
 *                       description: Number of difficulty-based questions
 *                     scope:
 *                       type: string
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       content:
 *                         type: string
 *                       choices:
 *                         type: array
 *                       difficulty:
 *                         type: string
 *                       hasIRT:
 *                         type: boolean
 *                 totalQuestions:
 *                   type: integer
 *                 duration:
 *                   type: integer
 *                   description: Quiz duration in minutes
 *       400:
 *         description: Invalid request or insufficient questions
 *       401:
 *         description: Unauthorized - missing or invalid JWT
 *       403:
 *         description: Forbidden - cannot generate quiz for other users
 *       404:
 *         description: Course or sections not found
 *       429:
 *         description: Too many requests - rate limit exceeded
 *       500:
 *         description: Quiz generation failed
 */
router.post(
  '/generate',
  authenticateJWT,
  rateLimit('quiz-generation', 10, 60), // 10 requests per minute per user
  generateQuiz
);

export default router;





