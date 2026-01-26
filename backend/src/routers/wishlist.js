import express from 'express';
import { toggleWishlist, getWishlist, checkWishlistStatus } from '../controllers/wishlistController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Wishlist management API
 */

/**
 * @swagger
 * /wishlist/toggle:
 *   post:
 *     summary: Toggle course in wishlist
 *     tags: [Wishlist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wishlist updated
 */
router.post('/toggle', authenticateJWT, toggleWishlist);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get user wishlist
 *     tags: [Wishlist]
 *     responses:
 *       200:
 *         description: List of wishlist items
 */
router.get('/', authenticateJWT, getWishlist);

/**
 * @swagger
 * /wishlist/{courseId}:
 *   get:
 *     summary: Check if course is in wishlist
 *     tags: [Wishlist]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wishlist status
 */
router.get('/:courseId', authenticateJWT, checkWishlistStatus);

export default router;
