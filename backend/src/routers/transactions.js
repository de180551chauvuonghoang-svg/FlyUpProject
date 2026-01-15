
import express from 'express';
import { getTransactions } from '../controllers/transactionController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes in this router
// Auth middleware applied below

router.get('/', authenticateJWT, getTransactions);

export default router;
