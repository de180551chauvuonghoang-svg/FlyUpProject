
import express from 'express';
import { chat, tts, transcribeVideo } from '../../controllers/ai/chatbotController.js';
import { chatStream } from '../../controllers/ai/chatbotStreamingController.js';
import { rateLimit } from '../../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: AI Chatbot API
 */

/**
 * @swagger
 * /chatbot/stream:
 *   post:
 *     summary: Chat with AI (Streaming SSE)
 *     tags: [Chatbot]
 *     description: Server-Sent Events (SSE) endpoint for streaming AI responses in real-time
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message to the chatbot
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional session ID for conversation memory (must be UUID v4)
 *     responses:
 *       200:
 *         description: SSE stream of AI response chunks
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: |
 *                 data: {"type":"start","sessionId":"uuid"}
 *                 data: {"type":"chunk","text":"Hello","index":0}
 *                 data: {"type":"chunk","text":" world","index":1}
 *                 data: {"type":"complete","fullText":"Hello world"}
 *       400:
 *         description: Invalid request
 *       429:
 *         description: Too many requests - rate limit exceeded (5 requests per minute)
 *       500:
 *         description: Server error
 */
router.post('/stream', rateLimit('chatbot:stream', 5, 60), chatStream);

/**
 * @swagger
 * /chatbot:
 *   post:
 *     summary: Chat with AI
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message to the chatbot
 *               sessionId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional session ID for conversation memory (must be UUID v4)
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Deprecated - use sessionId for automatic conversation memory
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 response:
 *                   type: string
 *                 sessionId:
 *                   type: string
 *       400:
 *         description: Invalid request (missing message or invalid sessionId)
 *       429:
 *         description: Too many requests - rate limit exceeded (10 requests per minute)
 *       500:
 *         description: Server error
 */
router.post('/tts', tts);
router.post('/transcribe', transcribeVideo);
router.post('/', rateLimit('chatbot', 10, 60), chat);

export default router;





