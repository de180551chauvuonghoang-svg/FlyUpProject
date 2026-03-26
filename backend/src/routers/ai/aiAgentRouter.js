import express from 'express';
import { chatWithAgent } from '../../controllers/ai/aiAgentController.js';
import { summarizeDocument } from '../../controllers/ai/aiSummarizationController.js';
import { authenticateJWT } from '../../middleware/authMiddleware.js';
import { rateLimit } from '../../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI Advanced
 *   description: Advanced AI Agent and Summarization API
 */

/**
 * @swagger
 * /api/ai/agent/chat:
 *   post:
 *     summary: Chat with AI Agent (Streaming + Tool Calling)
 *     tags: [AI Advanced]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *               modelName:
 *                 type: string
 *               systemPrompt:
 *                 type: string
 */
router.post('/chat', authenticateJWT, rateLimit('ai-agent', 10, 60), chatWithAgent);

/**
 * @swagger
 * /api/ai/agent/summarize:
 *   post:
 *     summary: Summarize document/lecture/article
 *     tags: [AI Advanced]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - type
 *             properties:
 *               id:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [lecture, article, material]
 *               language:
 *                 type: string
 *                 default: vi
 */
router.post('/summarize', authenticateJWT, rateLimit('ai-summarize', 10, 60), summarizeDocument);

export default router;
