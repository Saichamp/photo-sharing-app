/**
 * Authentication Routes for PhotoManEa
 * Defines all auth-related endpoints
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateBody } = require('../utils/validators');

/**
 * Authentication middleware (placeholder)
 */
const authenticate = (req, res, next) => {
  next();
};

/**
 * @route   POST /api/auth/register
 * @desc    Register new organizer
 * @access  Public
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
 */
router.post(
  '/login',
  authLimiter,
  validateBody('login'),  // ✅ This works
  authController.login
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update user profile
 * @access  Private
 * NO VALIDATOR YET - will add later
 */
router.put('/update-profile', authenticate, authController.updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * NO VALIDATOR YET - will add later
 */
router.put('/change-password', authenticate, authController.changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify JWT token
 * @access  Private
 */
router.get('/verify-token', authenticate, authController.verifyToken);

/**
 * @route   DELETE /api/auth/delete-account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/delete-account', authenticate, authController.deleteAccount);

module.exports = router;
