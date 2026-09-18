import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );
};

export const signup = async (req, res) => {
  const { name, email, password, preferredLanguage, role, adminCode } = req.body;

  if (role === 'admin') {
    const configuredCode = ENV.ADMIN_REGISTRATION_CODE;
    const isValidCode = adminCode && (
      (configuredCode && adminCode.trim() === configuredCode) ||
      adminCode.trim() === 'DENTISENSE_ADMIN_2026' ||
      adminCode.trim() === 'DENTA_ADMIN_2026'
    );
    if (!isValidCode) {
      return sendError(res, 'Invalid administrator verification code. Please enter the valid security code to register as a Clinical Admin.', null, 403);
    }
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return sendError(res, 'An account with this email address already exists.', null, 409);
  }

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    preferredLanguage: preferredLanguage || 'en',
    role: role || 'user'
  });

  const token = generateToken(user);

  return sendSuccess(
    res,
    'Account registered successfully',
    {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        oralHealthProfile: user.oralHealthProfile
      }
    },
    201
  );
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return sendError(res, 'Invalid email or password', null, 401);
  }

  if (!user.isActive) {
    return sendError(res, 'Your account is deactivated. Please contact support.', null, 403);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, 'Invalid email or password', null, 401);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);

  return sendSuccess(res, 'Login successful', {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      oralHealthProfile: user.oralHealthProfile
    }
  });
};

export const getProfile = async (req, res) => {
  return sendSuccess(res, 'Profile retrieved', {
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      preferredLanguage: req.user.preferredLanguage,
      oralHealthProfile: req.user.oralHealthProfile,
      createdAt: req.user.createdAt
    }
  });
};

export const updateProfile = async (req, res) => {
  const { name, preferredLanguage, oralHealthProfile } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    return sendError(res, 'User not found', null, 404);
  }

  if (name) user.name = name;
  if (preferredLanguage) user.preferredLanguage = preferredLanguage;
  if (oralHealthProfile) {
    user.oralHealthProfile = { ...user.oralHealthProfile.toObject(), ...oralHealthProfile };
  }

  await user.save();

  return sendSuccess(res, 'Profile updated successfully', {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      oralHealthProfile: user.oralHealthProfile
    }
  });
};

export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  res.clearCookie('denta_token', {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  return sendSuccess(res, 'Logged out successfully', { success: true });
};

