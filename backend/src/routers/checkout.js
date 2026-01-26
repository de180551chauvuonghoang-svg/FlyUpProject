import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import * as checkoutController from '../controllers/checkoutController.js';

import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Checkout
 *   description: Checkout and payment API
 */

/**
 * @swagger
 * /checkout/create:
 *   post:
 *     summary: Create a checkout session
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartItems
 *             properties:
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *               couponCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout created
 *       400:
 *         description: Invalid input
 */
router.post('/create', authenticateJWT, checkoutController.createCheckout);

/**
 * @swagger
 * /checkout/{id}/status:
 *   get:
 *     summary: Get checkout status
 *     tags: [Checkout]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Checkout status
 */
router.get('/:id/status', authenticateJWT, checkoutController.getCheckoutStatus);

/**
 * @swagger
 * /checkout/webhook/simulate:
 *   post:
 *     summary: Simulate payment webhook
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook/simulate', checkoutController.webhookPayment);

/**
 * @swagger
 * /checkout/webhook/casso:
 *   post:
 *     summary: Casso payment webhook
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook/casso', paymentController.handleCassoWebhook);

/**
 * @swagger
 * /checkout/check-coupon:
 *   post:
 *     summary: Check coupon validity
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponCode
 *             properties:
 *               couponCode:
 *                 type: string
 *               courseIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Coupon is valid
 *       400:
 *         description: Invalid coupon
 */
router.post('/check-coupon', authenticateJWT, checkoutController.checkCoupon);

/**
 * @swagger
 * /checkout/{id}/apply-coupon:
 *   post:
 *     summary: Apply coupon to checkout
 *     tags: [Checkout]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponCode
 *             properties:
 *               couponCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon applied
 */
router.post('/:id/apply-coupon', authenticateJWT, checkoutController.applyCoupon);

/**
 * @swagger
 * /checkout/coupons:
 *   get:
 *     summary: Get available coupons
 *     tags: [Checkout]
 *     responses:
 *       200:
 *         description: List of coupons
 */
router.get('/coupons', authenticateJWT, checkoutController.getAvailableCoupons);

export default router;
