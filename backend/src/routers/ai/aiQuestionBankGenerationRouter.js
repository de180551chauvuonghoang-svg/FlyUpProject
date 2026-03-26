import express from 'express';
import { bulkGenerateToBank } from '../../controllers/ai/aiQuestionBankGenerationController.js';
import { authenticateJWT } from '../../middleware/authMiddleware.js';
import { rateLimit } from '../../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/ai/question-bank/generate:
 *   post:
 *     summary: Bulk generate AI questions for a Question Bank
 *     tags: [Question Bank AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionBankId
 *               - courseId
 *             properties:
 *               questionBankId:
 *                 type: string
 *                 format: uuid
 *               courseId:
 *                 type: string
 *                 format: uuid
 *               count:
 *                 type: integer
 *                 default: 5
 *               difficulty:
 *                 type: string
 *                 enum: [Easy, Medium, Hard, Mixed]
 *                 default: Mixed
 *     responses:
 *       200:
 *         description: Questions generated and saved
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Generation failed
 */
router.post(
  '/generate',
  authenticateJWT,
  rateLimit('ai-gen-bank', 5, 60), // 5 requests per minute
  bulkGenerateToBank
);

export default router;
