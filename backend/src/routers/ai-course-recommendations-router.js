import express from 'express';
import { getRecommendations, getRecommendationHealth } from '../controllers/ai-course-recommendation-controller.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import { rateLimit } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: AI-powered course recommendations
 */

/**
 * @swagger
 * /api/recommendations/health:
 *   get:
 *     summary: Health check for recommendation service
 *     tags: [Recommendations]
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
 *                 ai:
 *                   type: object
 *                   properties:
 *                     provider:
 *                       type: string
 *                     healthy:
 *                       type: boolean
 *       503:
 *         description: Service is unhealthy
 */
router.get('/health', getRecommendationHealth);

/**
 * @swagger
 * /api/recommendations/{userId}:
 *   get:
 *     summary: Get personalized course recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to get recommendations for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *         description: Number of recommendations to return
 *     responses:
 *       200:
 *         description: Successful response with recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       courseId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       price:
 *                         type: number
 *                       level:
 *                         type: string
 *                       instructor:
 *                         type: string
 *                       category:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       ratingCount:
 *                         type: integer
 *                       thumbnailUrl:
 *                         type: string
 *                       learnerCount:
 *                         type: integer
 *                       score:
 *                         type: number
 *                         description: Recommendation confidence (0-1)
 *                       reasoning:
 *                         type: string
 *                         description: Why this course was recommended
 *                 cached:
 *                   type: boolean
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - missing or invalid JWT
 *       403:
 *         description: Forbidden - cannot access other user's recommendations
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests - rate limit exceeded
 *       503:
 *         description: AI service temporarily unavailable
 */
router.get(
  '/:userId',
  authenticateJWT,
  rateLimit('recommendations', 10, 60), // 10 requests per minute
  getRecommendations
);

export default router;
