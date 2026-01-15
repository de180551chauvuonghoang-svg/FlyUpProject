import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import * as checkoutController from '../controllers/checkoutController.js';

import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create', authenticateJWT, checkoutController.createCheckout);
router.get('/:id/status', authenticateJWT, checkoutController.getCheckoutStatus);
router.post('/webhook/simulate', checkoutController.webhookPayment);
router.post('/webhook/casso', paymentController.handleCassoWebhook);
// Check coupon validity
router.post('/check-coupon', authenticateJWT, checkoutController.checkCoupon);

// Apply coupon
router.post('/:id/apply-coupon', authenticateJWT, checkoutController.applyCoupon);

// Get available coupons
router.get('/coupons', authenticateJWT, checkoutController.getAvailableCoupons);

export default router;
