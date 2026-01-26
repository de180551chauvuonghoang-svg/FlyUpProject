import express from 'express';
import * as commentController from '../controllers/commentController.js';
import { authenticateJWT, optionalAuthenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management API
 */

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Add a comment
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - content
 *             properties:
 *               courseId:
 *                 type: string
 *               content:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post('/', authenticateJWT, commentController.addComment);

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get comments for a course
 *     tags: [Comments]
 *     parameters:
 *       - in: query
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/', commentController.getComments);

export default router;
