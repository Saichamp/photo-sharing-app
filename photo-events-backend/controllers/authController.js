/**
 * Authentication Controller for PhotoManEa
 * Handles user registration, login, and token management
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { AppError, asyncHandler, successResponse } = require('../middleware/errorHandler');
const { logAuth, logger } = require('../utils/logger');

/**
 * Generate JWT Token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (userId) => {
  if (!config.jwt.refreshSecret) {
    return null;
  }
  
  return jwt.sign(
    { id: userId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
};

/**
 * Send Token Response
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
 // Remove password from output
user.password = undefined;

// Update last login (use updateOne to avoid triggering pre-save hooks)
User.updateOne(
  { _id: user._id },
  { lastLogin: new Date() }
).exec();

  // Log authentication event
  logAuth('login-success', user._id, {
    email: user.email,
    role: user.role
  });
  
  // Send response
  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        quota: user.quota,
        isEmailVerified: user.isEmailVerified
      },
      token,
      refreshToken
    }
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new organizer
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  
  // Validate input
  if (!name || !email || !password) {
    throw new AppError('Please provide name, email and password', 400);
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }
  
  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: 'organizer'
  });
  
  logger.info('New user registered', {
    userId: user._id,
    email: user.email
  });
  
  // Send token response
  sendTokenResponse(user, 201, res, 'Registration successful');
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }
  
  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    logAuth('login-failed', null, { email, reason: 'user-not-found' });
    throw new AppError('Invalid email or password', 401);
  }
  
  // Check if user is active
  if (!user.isActive) {
    logAuth('login-failed', user._id, { email, reason: 'account-inactive' });
    throw new AppError('Your account has been deactivated', 403);
  }
  
  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  
  if (!isPasswordCorrect) {
    logAuth('login-failed', user._id, { email, reason: 'wrong-password' });
    throw new AppError('Invalid email or password', 401);
  }
  
  // Send token response
  sendTokenResponse(user, 200, res, 'Login successful');
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  // ✅ FIX: Check if user exists and has _id or id
  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  // Use _id (MongoDB default) or id (if using virtual)
  const userId = req.user._id || req.user.id;
  
  if (!userId) {
    throw new AppError('User ID not found', 500);
  }

  // Fetch fresh user data
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('User no longer exists', 404);
  }

  successResponse(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    plan: user.plan,
    quota: user.quota,
    createdAt: user.createdAt
  }, 'User profile retrieved successfully');
});


/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update user profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;
  
  // Fields allowed to be updated
  const fieldsToUpdate = {};
  if (name) fieldsToUpdate.name = name;
  if (email) fieldsToUpdate.email = email;
  
  // Check if email is being changed and if it's already in use
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }
    // If email changed, mark as unverified
    fieldsToUpdate.isEmailVerified = false;
  }
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );
  
  logger.info('User profile updated', {
    userId: user._id,
    updatedFields: Object.keys(fieldsToUpdate)
  });
  
  successResponse(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified
  }, 'Profile updated successfully');
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password', 400);
  }
  
  // Get user with password
  const user = await User.findById(req.user.id).select('+password');
  
  // Check current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  
  if (!isPasswordCorrect) {
    logAuth('password-change-failed', user._id, { reason: 'wrong-current-password' });
    throw new AppError('Current password is incorrect', 401);
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  logAuth('password-changed', user._id);
  logger.info('User password changed', { userId: user._id });
  
  // Generate new token
  sendTokenResponse(user, 200, res, 'Password changed successfully');
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token using refresh token
 * @access  Public
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }
  
  if (!config.jwt.refreshSecret) {
    throw new AppError('Refresh token not configured', 500);
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      throw new AppError('Invalid refresh token', 401);
    }
    
    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    
    logger.info('Token refreshed', { userId: user._id });
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid refresh token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired', 401);
    }
    throw error;
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  // Log if user is authenticated, otherwise anonymous logout
  const userId = req.user?._id || req.user?.id || 'anonymous';
  
  if (userId !== 'anonymous') {
    logAuth('logout', userId);
    logger.info('User logged out', { userId });
  } else {
    logger.info('Anonymous logout attempt');
  }
  
  successResponse(res, null, 'Logout successful');
});


/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify if token is valid
 * @access  Private
 */
exports.verifyToken = asyncHandler(async (req, res, next) => {
  // If we reach here, token is valid (checked by authenticate middleware)
  successResponse(res, {
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  }, 'Token is valid');
});

/**
 * @route   DELETE /api/auth/delete-account
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    throw new AppError('Please provide your password to confirm', 400);
  }
  
  // Get user with password
  const user = await User.findById(req.user.id).select('+password');
  
  // Verify password
  const isPasswordCorrect = await user.comparePassword(password);
  
  if (!isPasswordCorrect) {
    throw new AppError('Password is incorrect', 401);
  }
  
  // Soft delete: deactivate account
  user.isActive = false;
  await user.save();
  
  logAuth('account-deleted', user._id);
  logger.warn('User account deleted', {
    userId: user._id,
    email: user.email
  });
  
  successResponse(res, null, 'Account deleted successfully');
});
