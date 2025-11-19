/**
 * Authentication Routes for PhotoManEa
 * Defines all auth-related endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateBody } = require('../utils/validators');

// We'll create this middleware in the next step
// For now, we'll define a placeholder
const authenticate = (req, res, next) => {
  // Will be replaced with actual middleware in Step 1.4
  next();
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new organizer
 * @access  Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post(
  '/register',
  authLimiter,
  validateBody('signup'),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get token
 * @access  Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post(
  '/login',
  authLimiter,
  validateBody('login'),
  authController.login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh-token',
  authController.refreshToken
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update user profile (name, email)
 * @access  Private
 */
router.put(
  '/update-profile',
  authenticate,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  authController.changePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify if JWT token is valid
 * @access  Private
 */
router.get(
  '/verify-token',
  authenticate,
  authController.verifyToken
);

/**
 * @route   DELETE /api/auth/delete-account
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
router.delete(
  '/delete-account',
  authenticate,
  authController.deleteAccount
);

module.exports = router;
