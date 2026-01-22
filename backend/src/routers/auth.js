import express from 'express';
import * as authController from '../controllers/authController.js';
import { validateSignup, validateLogin } from '../middleware/validationMiddleware.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

import rateLimit from 'express-rate-limit';
import { body } from 'express-validator';

const router = express.Router();

const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 5, // Limit each IP to 5 OTP requests per hour
    message: { error: 'Too many OTP requests from this IP, please try again after an hour' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Send OTP
router.post('/send-otp', 
    otpLimiter,
    [
        body('email').isEmail().withMessage('Invalid email address').normalizeEmail()
    ],
    authController.sendOtp
);

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

// GitHub Login
router.post('/github', authController.githubLogin);

// Change password
router.post('/change-password', authenticateJWT, authController.changePassword);

export default router;
