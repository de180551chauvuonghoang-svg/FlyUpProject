import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../configs/supabase.js';
import prisma from '../lib/prisma.js';

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

  // Generate tokens
  const token = uuidv4();
  const refreshToken = uuidv4();

  // Create user in database
  const newUser = await prisma.users.create({
    data: {
      UserName: generateUsername(email),
      Password: hashedPassword,
      Email: email.toLowerCase(),
      FullName: fullName,
      MetaFullName: removeAccents(fullName),
      AvatarUrl: '',
      Role: userRole,
      Token: token,
      RefreshToken: refreshToken,
      IsVerified: false,
      IsApproved: false,
      AccessFailedCount: 0,
      Bio: '',
      EnrollmentCount: 0,
      SystemBalance: BigInt(0),
    }
  });

  return newUser;
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

  return user;
};

export const logoutUser = async (token) => {
  // For stateless/simple token auth, we might just return true.
  // Or ideally, invalidate the token in DB.
  return true;
};

export const getCurrentUser = async (token) => {
  const user = await prisma.users.findFirst({
    where: { Token: token }
  });

  if (!user) {
    throw new Error('Invalid or expired token');
  }

  return user;
};

export const requestPasswordReset = async (email) => {
  // This might still need Supabase if we don't have our own mailer logic for tokens yet.
  // For now, let's keep it but warn or comment it out if it relies on Supabase Auth users which don't exist.
  // Since we are moving away from Supabase Auth, this will likely fail too if it tries to find a Supabase user.
  // Leaving as is for now to focus on Login, but adding a TODO/Comment.
  /*
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });
  */
  throw new Error('Password reset not yet implemented for custom auth');
};

export const refreshSession = async (refreshToken) => {
  const user = await prisma.users.findFirst({
    where: { RefreshToken: refreshToken }
  });

  if (!user) {
    throw new Error('Invalid refresh token');
  }
  
  // In a real app, we would rotate tokens here.
  return user;
};
