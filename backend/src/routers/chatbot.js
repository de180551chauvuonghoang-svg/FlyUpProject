
import express from 'express';
import { chat } from '../controllers/chatbotController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chatbot
 *   description: AI Chatbot API
 */

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
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/', chat);

export default router;
