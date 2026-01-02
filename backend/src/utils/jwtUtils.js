import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Environment variables for JWT secrets and expiry times
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-access-token-key-min-32-chars';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-jwt-refresh-token-key-min-32-chars';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '30m'; // 30 minutes
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'; // 7 days

/**
 * Generate JWT Access Token (short-lived)
 * @param {Object} payload - Token payload { userId, email, role }
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  const { userId, email, role } = payload;
  
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      type: 'access'
    },
    JWT_SECRET,
    { 
      expiresIn: JWT_ACCESS_EXPIRY,
      issuer: 'flyup-edutech',
      audience: 'flyup-users'
    }
  );
};

/**
 * Generate JWT Refresh Token (long-lived)
 * @param {Object} payload - Token payload { userId, email }
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  const { userId, email } = payload;
  
  return jwt.sign(
    { 
      userId, 
      email,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { 
      expiresIn: JWT_REFRESH_EXPIRY,
      issuer: 'flyup-edutech',
      audience: 'flyup-users'
    }
  );
};

/**
 * Verify JWT Access Token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'flyup-edutech',
      audience: 'flyup-users'
    });
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    } else {
      throw error;
    }
  }
};

/**
 * Verify JWT Refresh Token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'flyup-edutech',
      audience: 'flyup-users'
    });
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      throw error;
    }
  }
};

/**
 * Hash refresh token for secure storage in database
 * @param {string} token - Plain text refresh token
 * @returns {string} Hashed token
 */
export const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Decode JWT without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Get token expiration time in milliseconds
 * @param {Object} decodedToken - Decoded JWT token
 * @returns {number} Expiration time in milliseconds
 */
export const getTokenExpiry = (decodedToken) => {
  return decodedToken.exp * 1000; // Convert to milliseconds
};
