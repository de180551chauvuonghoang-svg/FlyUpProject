import express from 'express';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware.js';
import * as payoutController from '../controllers/payoutController.js';

const router = express.Router();

// All payout routes require authentication
router.use(authenticateJWT);

/**
 * Instructor Routes
 */
router.get('/wallet', authorizeRoles('Instructor'), payoutController.getWalletDashboard);
router.put('/bank-details', authorizeRoles('Instructor'), payoutController.updateBankDetails);
router.post('/withdraw', authorizeRoles('Instructor'), payoutController.requestWithdrawal);
router.get('/history', authorizeRoles('Instructor'), payoutController.getWithdrawalHistory);

/**
 * Admin Routes
 */
router.get('/admin/requests', authorizeRoles('Admin'), payoutController.getAllWithdrawalRequests);
router.put('/admin/requests/:id', authorizeRoles('Admin'), payoutController.processWithdrawalRequest);

export default router;
