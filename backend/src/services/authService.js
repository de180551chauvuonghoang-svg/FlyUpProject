import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../configs/supabase.js';
import * as emailService from './emailService.js';
import prisma from '../lib/prisma.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashRefreshToken 
} from '../utils/jwtUtils.js';

// Helper to generate username from email
const generateUsername = (email) => {
  const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${baseUsername}${Math.floor(Math.random() * 1000)}`;
};

// Helper to generate meta name (remove Vietnamese accents)
const removeAccents = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

export const registerUser = async ({ email, password, fullName, role }) => {
  // Validate role
  const validRoles = ['learner', 'instructor'];
  const userRole = validRoles.includes(role) ? role : 'learner';

  // Check if email already exists
  const existingUser = await prisma.users.findFirst({
    where: { Email: email.toLowerCase() }
  });

  if (existingUser) {
    throw new Error('Email already exists');
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user ID first (needed for JWT payload)
  const userId = uuidv4();

  // Generate JWT tokens
  const accessToken = generateAccessToken({ 
    userId, 
    email: email.toLowerCase(), 
    role: userRole 
  });
  
  const refreshToken = generateRefreshToken({ 
    userId, 
    email: email.toLowerCase() 
  });

  // Hash refresh token before storing
  const hashedRefreshToken = hashRefreshToken(refreshToken);

  // Create user in database
  const newUser = await prisma.users.create({
    data: {
      Id: userId,
      UserName: generateUsername(email),
      Password: hashedPassword,
      Email: email.toLowerCase(),
      FullName: fullName,
      MetaFullName: removeAccents(fullName),
      AvatarUrl: '',
      Role: userRole,
      Token: '', // JWT access tokens are stateless, not stored in DB
      RefreshToken: hashedRefreshToken, // Store hashed refresh token only
      IsVerified: false,
      IsApproved: false,
      AccessFailedCount: 0,
      Bio: '',
      EnrollmentCount: 0,
      SystemBalance: BigInt(0),
    }
  });

  // Return user with plain refresh token (not hashed)
  return {
    ...newUser,
    accessToken, // Include access token for response
    plainRefreshToken: refreshToken // Include plain refresh token for response
  };
};

export const loginUser = async ({ email, password }) => {
  // Find user by email
  const user = await prisma.users.findFirst({
    where: { Email: email.toLowerCase() }
  });

  if (!user) {
    throw new Error('Invalid login credentials');
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.Password);
  if (!isMatch) {
    throw new Error('Invalid login credentials');
  }

  // Generate new JWT tokens
  const accessToken = generateAccessToken({ 
    userId: user.Id, 
    email: user.Email, 
    role: user.Role 
  });
  
  const refreshToken = generateRefreshToken({ 
    userId: user.Id, 
    email: user.Email 
  });

  // Hash refresh token before storing
  const hashedRefreshToken = hashRefreshToken(refreshToken);

  // Update refresh token in database (access token is stateless, not stored)
  await prisma.users.update({
    where: { Id: user.Id },
    data: { 
      RefreshToken: hashedRefreshToken 
    }
  });

  // Return user with tokens (access token not in DB, only in response)
  return {
    ...user,
    accessToken, // Return for API response (not stored in DB)
    RefreshToken: refreshToken, // Plain token for response
    plainRefreshToken: refreshToken
  };
};

export const logoutUser = async (refreshToken) => {
  if (!refreshToken) {
    // If no refresh token provided, just return (client-side logout)
    return true;
  }

  try {
    // Hash the refresh token to find it in database
    const hashedToken = hashRefreshToken(refreshToken);
    
    // Find and clear the refresh token in database
    await prisma.users.updateMany({
      where: { RefreshToken: hashedToken },
      data: { RefreshToken: '' }
    });
    
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    // Even if DB update fails, we still return true 
    // since client will clear tokens anyway
    return true;
  }
};

export const getCurrentUser = async (userId) => {
  const user = await prisma.users.findFirst({
    where: { Id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const requestPasswordReset = async (email) => {
  const user = await prisma.users.findFirst({
    where: { Email: email.toLowerCase() }
  });

  if (!user) {
    // Determine whether to throw error or return silently (to prevent enumeration)
    // For this assignment, let's return silently or throw specific error
    // Let's throw error for now to be explicit in UI
    throw new Error('User not found');
  }

  const resetToken = uuidv4();
  
  // In a real app, store this token with expiry. 
  // For now, let's update the main Token (logging them out) or assume this Token is the reset token.
  await prisma.users.update({
    where: { Id: user.Id },
    data: { Token: resetToken }
  });

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  // Import emailService dynamically or use the imported one (check top of file)
  // I need to make sure emailService is imported.
  // It is NOT imported in the original file view I saw. I need to add import.
  
  // Since I can't easily add import at top with this chunk, I will assume it's there or I will add it using a separate chunk.
  // Wait, I checked authService.js view, it imports 'emailService' ? NO.
  // authController imported emailService. authService did NOT.
  // So I must add import.
  
  // Implementation continues below...
  await import('../services/emailService.js').then(service => {
      service.sendPasswordResetEmail(email, resetLink);
  });
  
  return true;
};

export const confirmPasswordReset = async (token, newPassword) => {
  // Find user by Reset Token (using Token field as per my previous hack, or ideally RefreshToken or a new field)
  // In requestPasswordReset I used 'Token' field to store the reset token.
  const user = await prisma.users.findFirst({
    where: { Token: token }
  });

  if (!user) {
    throw new Error('Invalid or expired token');
  }

  // Hash new password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
  // Generate new auth token (invalidate reset token)
  const newToken = uuidv4();

  // Update password and token
  await prisma.users.update({
    where: { Id: user.Id },
    data: { 
      Password: hashedPassword,
      Token: newToken // Rotate token so link cannot be used again
    }
  });

  return true;
};

export const refreshSession = async (refreshToken) => {
  // Verify JWT refresh token first
  const { verifyRefreshToken } = await import('../utils/jwtUtils.js');
  
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }

  // Hash the provided refresh token to compare with stored hash
  const hashedToken = hashRefreshToken(refreshToken);

  // Find user by hashed refresh token
  const user = await prisma.users.findFirst({
    where: { 
      RefreshToken: hashedToken,
      Id: decoded.userId // Also verify userId matches
    }
  });

  if (!user) {
    throw new Error('Invalid refresh token');
  }
  
  // Generate new access token
  const newAccessToken = generateAccessToken({ 
    userId: user.Id, 
    email: user.Email, 
    role: user.Role 
  });

  // Optionally rotate refresh token (recommended for security)
  const newRefreshToken = generateRefreshToken({ 
    userId: user.Id, 
    email: user.Email 
  });
  const hashedNewRefreshToken = hashRefreshToken(newRefreshToken);

  // Update only refresh token in database (access token is stateless)
  await prisma.users.update({
    where: { Id: user.Id },
    data: { 
      RefreshToken: hashedNewRefreshToken 
    }
  });

  return {
    ...user,
    accessToken: newAccessToken, // Return for API response (not stored in DB)
    RefreshToken: newRefreshToken, // Return plain new refresh token
    plainRefreshToken: newRefreshToken
  };
};

export const loginWithGoogle = async (credential) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  
  const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,  
  });
  const payload = ticket.getPayload();
  const { email, name, picture } = payload;

  if (!email) {
      throw new Error('Google account does not have an email');
  }

  // Check if user exists
  let user = await prisma.users.findFirst({
        where: { Email: email.toLowerCase() }
  });

  if (!user) {
      // Create new user
      const userId = uuidv4();
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueUsername = `${baseUsername}${Math.floor(Math.random() * 1000)}`;

      // Generate JWT tokens
      const accessToken = generateAccessToken({ 
        userId, 
        email: email.toLowerCase(), 
        role: 'learner' 
      });
      
      const refreshToken = generateRefreshToken({ 
        userId, 
        email: email.toLowerCase() 
      });

      const hashedRefreshToken = hashRefreshToken(refreshToken);

      user = await prisma.users.create({
          data: {
              Id: userId,
              UserName: uniqueUsername,
              Password: '', // No password for Google users
              Email: email.toLowerCase(),
              FullName: name || 'Google User',
              MetaFullName: removeAccents(name || 'Google User'),
              AvatarUrl: picture || '',
              Role: 'learner', // Default role
              Token: '', // Access token not stored (stateless)
              RefreshToken: hashedRefreshToken,
              IsVerified: true, // Google emails are verified
              IsApproved: true,
              AccessFailedCount: 0,
              LoginProvider: 'Google',
              ProviderKey: email,
              SystemBalance: BigInt(0),
          }
      });

      // Attach plain refresh token for response
      user.plainRefreshToken = refreshToken;
  } else {
      // Generate new tokens for existing user
      const accessToken = generateAccessToken({ 
        userId: user.Id, 
        email: user.Email, 
        role: user.Role 
      });
      
      const refreshToken = generateRefreshToken({ 
        userId: user.Id, 
        email: user.Email 
      });

      const hashedRefreshToken = hashRefreshToken(refreshToken);

      // Update refresh token and LoginProvider (access token not stored)
      await prisma.users.update({
        where: { Id: user.Id },
        data: { 
          RefreshToken: hashedRefreshToken,
          LoginProvider: 'Google',
          IsVerified: true 
        }
      });

      user.accessToken = accessToken; // For response only
      user.RefreshToken = refreshToken;
      user.plainRefreshToken = refreshToken;
  }

  return user;
};
