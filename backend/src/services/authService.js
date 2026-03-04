import crypto from 'crypto';
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
    where: { Email: { equals: email.toLowerCase(), mode: 'insensitive' } }
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
  // Find user by email (case-insensitive)
  const user = await prisma.users.findFirst({
    where: { Email: { equals: email.toLowerCase(), mode: 'insensitive' } }
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

export const loginWithGithub = async (code) => {
  // 1. Exchange code for access token
  const tokenUrl = 'https://github.com/login/oauth/access_token';
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
  }

  const accessToken = tokenData.access_token;

  // 2. Fetch user profile
  const userUrl = 'https://api.github.com/user';
  const userResponse = await fetch(userUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub user profile');
  }

  const githubUser = await userResponse.json();

  // 3. Fetch user emails (if primary email is private)
  let email = githubUser.email;
  if (!email) {
    const emailsUrl = 'https://api.github.com/user/emails';
    const emailsResponse = await fetch(emailsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      // Find primary and verified email
      const primaryEmail = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) || emails[0];
      if (primaryEmail) {
        email = primaryEmail.email;
      }
    }
  }

  if (!email) {
    throw new Error('GitHub account does not have a verified email');
  }

  const fullName = githubUser.name || githubUser.login;
  const avatarUrl = githubUser.avatar_url;

  // 4. Find or Create User (similar to Google login)
  let user = await prisma.users.findFirst({
    where: { Email: email.toLowerCase() }
  });

  if (!user) {
      // Create new user
      const userId = uuidv4();
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const uniqueUsername = `${baseUsername}${Math.floor(Math.random() * 1000)}`;

      // Generate JWT tokens
      const accessTokenJwt = generateAccessToken({ 
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
              Password: '', // No password for OAuth users
              Email: email.toLowerCase(),
              FullName: fullName,
              MetaFullName: removeAccents(fullName),
              AvatarUrl: avatarUrl || '',
              Role: 'learner',
              Token: '',
              RefreshToken: hashedRefreshToken,
              IsVerified: true,
              IsApproved: true,
              AccessFailedCount: 0,
              LoginProvider: 'GitHub',
              ProviderKey: githubUser.id.toString(),
              SystemBalance: BigInt(0),
          }
      });

      // Attach plain refresh token for response
      user.plainRefreshToken = refreshToken;
      user.accessToken = accessTokenJwt;
  } else {
      // Generate new tokens for existing user
      const accessTokenJwt = generateAccessToken({ 
        userId: user.Id, 
        email: user.Email, 
        role: user.Role 
      });
      
      const refreshToken = generateRefreshToken({ 
        userId: user.Id, 
        email: user.Email 
      });

      const hashedRefreshToken = hashRefreshToken(refreshToken);

      // Update refresh token
      await prisma.users.update({
        where: { Id: user.Id },
        data: { 
          RefreshToken: hashedRefreshToken,
          LoginProvider: 'GitHub',
          IsVerified: true 
        }
      });

      user.accessToken = accessTokenJwt;
      user.RefreshToken = refreshToken;
      user.plainRefreshToken = refreshToken;
  }

  return user;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.users.findUnique({
    where: { Id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Google/Github users might not have a password, but if they set one they can change it
  if (!user.Password && user.LoginProvider) {
    throw new Error(`Accounts logged in via ${user.LoginProvider} cannot change password here.`);
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.Password);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  // Check if new password is same as old
  const isSame = await bcrypt.compare(newPassword, user.Password);
  if (isSame) {
    throw new Error('New password cannot be the same as current password');
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await prisma.users.update({
    where: { Id: userId },
    data: { Password: hashedPassword }
  });


  return true;
};

export const createEmailOtp = async (emailInput) => {
  // Normalize email
  const email = emailInput.trim().toLowerCase();

  // 1. Generate 6-digit OTP using CSPRNG
  const otp = crypto.randomInt(100000, 1000000).toString();
  
  // 2. Hash OTP
  const saltRounds = 10;
  const otpHash = await bcrypt.hash(otp, saltRounds);
  
  // 3. Set expiry (3 minutes)
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000);
  
  // 4. Transactional Check & Upsert
  return await prisma.$transaction(async (tx) => {
      const existing = await tx.emailVerifications.findUnique({ 
          where: { Email: email } 
      });

      if (existing) {
          const now = new Date();
          const created = new Date(existing.CreatedAt);
          const diffSeconds = (now - created) / 1000;
          
          if (diffSeconds < 60) {
              throw new Error('RATE_LIMIT');
          }

          await tx.emailVerifications.update({
            where: { Email: email },
            data: {
                OtpHash: otpHash,
                ExpiresAt: expiresAt,
                CreatedAt: new Date(),
                AttemptCount: 0 // Reset attempts
            }
          });
      } else {
          // If concurrent create happens here, it will fail with P2002, which is fine (caller handles or retries)
          await tx.emailVerifications.create({
              data: {
                  Email: email,
                  OtpHash: otpHash,
                  ExpiresAt: expiresAt,
                  CreatedAt: new Date(),
                  AttemptCount: 0
              }
          });
      }
      
      return otp;
  });
};

export const verifyEmailOtp = async (emailInput, otp) => {
  // Normalize email
  const email = emailInput.trim().toLowerCase();

  const verification = await prisma.emailVerifications.findUnique({
    where: { Email: email }
  });

  if (!verification) {
    throw new Error('OTP not found or expired'); // Generic error
  }

  // Check expiry
  if (new Date() > verification.ExpiresAt) {
    throw new Error('OTP has expired');
  }

  // Check attempts
  if (verification.AttemptCount >= 5) {
    throw new Error('Too many failed attempts. Please request a new OTP.');
  }

  // Compare OTP
  const isValid = await bcrypt.compare(otp, verification.OtpHash);

  if (!isValid) {
    // Increment attempt count
    await prisma.emailVerifications.update({
      where: { Email: email },
      data: { AttemptCount: { increment: 1 } }
    });
    throw new Error('Invalid OTP');
  }

  // OTP is valid. Invalidate immediately.
  try {
      await prisma.emailVerifications.delete({
          where: { Email: email }
      });
  } catch (error) {
      console.error('Failed to invalidate OTP:', error);
      // Invalidation failed, so we must fail the verification to prevent reuse
      throw new Error('Verification failed. Please try again.');
  }

  return true;
};

export const verifyCurrentPassword = async (userId, password) => {
  const user = await prisma.users.findUnique({
    where: { Id: userId }
  });

  if (!user || !user.Password) {
    return false;
  }

  return await bcrypt.compare(password, user.Password);
};
