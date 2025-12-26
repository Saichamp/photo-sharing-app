/**
 * Admin Routes for PhotoManEa
 * All routes require admin authentication
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, restrictTo } = require('../middleware/authenticate');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(restrictTo('admin'));

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics
 * @access  Private/Admin
 */
router.get('/stats', adminController.getPlatformStats);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters
 * @access  Private/Admin
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get specific user details
 * @access  Private/Admin
 */
router.get('/users/:id', adminController.getUserById);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (ban/activate)
 * @access  Private/Admin
 */
router.put('/users/:id/status', adminController.updateUserStatus);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user account
 * @access  Private/Admin
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @route   GET /api/admin/events
 * @desc    Get all events from all users
 * @access  Private/Admin
 */
router.get('/events', adminController.getAllEvents);

/**
 * @route   DELETE /api/admin/events/:id
 * @desc    Delete any event
 * @access  Private/Admin
 */
router.delete('/events/:id', adminController.deleteEvent);

/**
 * @route   GET /api/admin/logs
 * @desc    Get activity/security logs
 * @access  Private/Admin
 */
router.get('/logs', adminController.getLogs);

module.exports = router;
