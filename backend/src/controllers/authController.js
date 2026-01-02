import * as authService from '../services/authService.js';
import * as emailService from '../services/emailService.js';

export const register = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password and full name are required'
      });
    }

    const newUser = await authService.registerUser({ email, password, fullName, role });

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
        username: newUser.UserName
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
        role: user.Role
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
        role: user.Role
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
