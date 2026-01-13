import express from 'express';
import * as commentController from '../controllers/commentController.js';
import { authenticateJWT, optionalAuthenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create Comment
router.post('/', authenticateJWT, commentController.addComment);

// Get Comments (Public or Optional Auth? Usually public for courses)
router.get('/', commentController.getComments);

export default router;
