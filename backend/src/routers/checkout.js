import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import * as checkoutController from '../controllers/checkoutController.js';

import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create', authenticateJWT, checkoutController.createCheckout);
router.get('/:id/status', authenticateJWT, checkoutController.getCheckoutStatus);
router.post('/webhook/simulate', checkoutController.webhookPayment);
router.post('/webhook/casso', paymentController.handleCassoWebhook);

export default router;
