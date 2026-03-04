
import express from 'express';
import { getTransactions } from '../controllers/transactionController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes in this router
// Auth middleware applied below

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction history API
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get user transactions
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/', authenticateJWT, getTransactions);

export default router;
