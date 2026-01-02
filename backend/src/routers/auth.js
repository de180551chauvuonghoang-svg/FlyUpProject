import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateSignup, validateLogin } from '../middleware/validationMiddleware.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register new user with Prisma
router.post('/register', validateSignup, authController.register);

// Login user
router.post('/login', validateLogin, authController.login);

// Logout user
router.post('/logout', authController.logout);

// Get current user (requires JWT authentication)
router.get('/me', authenticateJWT, authController.getMe);

// Request password reset
router.post('/forgot-password', authController.forgotPassword);

// Confirm password reset
router.post('/reset-password-confirm', authController.resetPasswordConfirm);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Google Login
router.post('/google', authController.googleLogin);

export default router;
