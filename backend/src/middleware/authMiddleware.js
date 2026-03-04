import { verifyAccessToken } from '../utils/jwtUtils.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT access token from Authorization header
 * Attaches decoded user info to req.user
 */
export const authenticateJWT = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No authorization header provided'
      });
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Invalid authorization format',
        message: 'Authorization header must be in format: Bearer <token>'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Handle different error types
    if (error.message === 'Access token has expired') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please refresh your token or login again.',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.message === 'Invalid access token' || error.message === 'Invalid token type') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid',
        code: 'TOKEN_INVALID'
      });
    } else {
      console.error('JWT Authentication Error:', error);
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: 'Could not authenticate request'
      });
    }
  }
};

/**
 * Optional JWT Authentication Middleware
 * Tries to verify JWT but doesn't fail if token is missing
 * Useful for routes that have different behavior for authenticated/unauthenticated users
 */
export const optionalAuthenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token
    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    // If token is invalid or expired, just continue without user
    req.user = null;
    next();
  }
};

/**
 * Role-based Authorization Middleware
 * Requires authenticateJWT to run first
 * @param {string[]} allowedRoles - Array of allowed roles
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};
