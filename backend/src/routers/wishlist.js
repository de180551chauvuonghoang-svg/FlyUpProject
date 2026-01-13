import express from 'express';
import { toggleWishlist, getWishlist, checkWishlistStatus } from '../controllers/wishlistController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/toggle', authenticateJWT, toggleWishlist);
router.get('/', authenticateJWT, getWishlist);
router.get('/:courseId', authenticateJWT, checkWishlistStatus);

export default router;
