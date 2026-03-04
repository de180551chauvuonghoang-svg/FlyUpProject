import * as authService from '../services/authService.js';
import * as emailService from '../services/emailService.js';
import prisma from '../lib/prisma.js'; 
import { validationResult } from 'express-validator';

export const sendOtp = async (req, res) => {
  try {
    // Input validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user already exists
    // We check directly against the DB to avoid creating a user accidently
    const userExists = await prisma.users.findFirst({
        where: { Email: { equals: email.toLowerCase(), mode: 'insensitive' } }
    });

    if (userExists) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Generate and Send OTP
    // Validates rate limit internally
    let otp;
    try {
        otp = await authService.createEmailOtp(email);
    } catch (err) {
        if (err.message === 'RATE_LIMIT') {
             return res.status(429).json({ error: 'Please wait 1 minute before requesting a new OTP' });
        }
        throw err;
    }
    
    // Send email
    const emailSent = await emailService.sendOtpEmail(email, otp);
    
    if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    res.json({ message: 'OTP sent successfully' });

  } catch (error) {
    console.error('Send OTP error:', error);
    if (error.code === 'EMAIL_SEND_FAILED') {
        return res.status(400).json({ error: 'Unable to send verification email. Please check your email address.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, fullName, role, otp } = req.body;

    if (!email || !password || !fullName || !otp) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, full name, and OTP are required'
      });
    }

    // Verify OTP first
    await authService.verifyEmailOtp(email, otp);

    // If verify succeeds, create user
    const newUser = await authService.registerUser({ email, password, fullName, role });

    // Delete used OTP
    await prisma.emailVerifications.deleteMany({
        where: { Email: email }
    });

    // Send welcome email asynchronously (don't block response)
    emailService.sendWelcomeEmail(email, fullName, process.env.FRONTEND_URL || 'http://localhost:5173')
      .catch(err => console.error('Failed to send welcome email:', err));

    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: newUser.Id,
        email: newUser.Email,
        fullName: newUser.FullName,
        role: newUser.Role,
        username: newUser.UserName,
        avatarUrl: newUser.AvatarUrl,
        bio: newUser.Bio,
        phone: newUser.Phone,
        dateOfBirth: newUser.DateOfBirth
      },
      session: {
        accessToken: newUser.accessToken,
        refreshToken: newUser.plainRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 1800 // 30 minutes in seconds
      }
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      return res.status(409).json({
        error: 'Email already exists',
        message: 'An account with this email already exists'
      });
    }
    if (error.message.includes('OTP')) {
        return res.status(400).json({
            error: error.message,
            message: error.message
        });
    }
    console.error('REGISTRATION ERROR:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    const user = await authService.loginUser({ email, password });

    res.json({
      message: 'Login successful',
      user: {
        id: user.Id,
        email: user.Email,
        fullName: user.FullName,
        role: user.Role,
        avatarUrl: user.AvatarUrl,
        bio: user.Bio,
        phone: user.Phone,
        dateOfBirth: user.DateOfBirth
      },
      session: {
        accessToken: user.accessToken,
        refreshToken: user.plainRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 1800 // 30 minutes in seconds
      }
    });
  } catch (error) {
    if (error.message === 'Invalid login credentials' || error.message.includes('Invalid credentials')) {
      return res.status(401).json({
        error: error.message,
        message: 'Invalid credentials'
      });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await authService.logoutUser(refreshToken);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    // User info is already verified and attached by authenticateJWT middleware
    // req.user contains { userId, email, role }
    
    // Fetch full user details from database if needed
    const user = await authService.getCurrentUser(req.user.userId);

    res.json({
      user: {
        id: user.Id,
        email: user.Email,
        fullName: user.FullName,
        role: user.Role,
        avatarUrl: user.AvatarUrl,
        bio: user.Bio,
        phone: user.Phone,
        dateOfBirth: user.DateOfBirth,
        createdAt: user.CreationTime
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await authService.requestPasswordReset(email);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPasswordConfirm = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    await authService.confirmPasswordReset(token, newPassword);
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password confirm error:', error);
    if (error.message === 'Invalid or expired token') {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const user = await authService.refreshSession(refreshToken);

    res.json({
      message: 'Token refreshed successfully',
      session: {
        accessToken: user.accessToken,
        refreshToken: user.plainRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 1800
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({ 
        error: 'Invalid refresh token', 
        message: error.message,
        code: 'REFRESH_TOKEN_INVALID' 
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    const user = await authService.loginWithGoogle(credential);

    res.json({
      message: 'Login successful',
      user: {
        id: user.Id,
        email: user.Email,
        fullName: user.FullName,
        avatarUrl: user.AvatarUrl,
        role: user.Role,
        bio: user.Bio,
        phone: user.Phone,
        dateOfBirth: user.DateOfBirth
      },
      session: {
        accessToken: user.accessToken,
        refreshToken: user.plainRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 1800
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    // Distinguish between Auth errors (usually string messages from service) and System errors
    if (error.message.includes('Google account') || error.message.includes('Invalid')) {
        return res.status(401).json({ error: error.message });
    }
    // Database or System errors
    res.status(500).json({ error: 'Login failed due to system error', details: error.message });
  }
};

export const githubLogin = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'GitHub authorization code is required' });
    }

    const user = await authService.loginWithGithub(code);

    res.json({
      message: 'Login successful',
      user: {
        id: user.Id,
        email: user.Email,
        fullName: user.FullName,
        avatarUrl: user.AvatarUrl,
        role: user.Role,
        bio: user.Bio,
        phone: user.Phone,
        dateOfBirth: user.DateOfBirth
      },
      session: {
        accessToken: user.accessToken,
        refreshToken: user.plainRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 1800
      }
    });
  } catch (error) {
    console.error('GitHub login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    await authService.changePassword(userId, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    if (error.message === 'Current password is incorrect' || error.message.includes('logged in via') || error.message.includes('New password cannot')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const isValid = await authService.verifyCurrentPassword(userId, password);
    res.json({ isValid });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
