/**
 * Admin Routes
 * Routes for admin operations
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/authenticate');

// ✅ Apply authentication and admin middleware to ALL routes
router.use(authenticate);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', adminController.getStats);

// User management
router.get('/users', adminController.getUsers);
router.delete('/users/:userId', adminController.deleteUser);
router.patch('/users/:userId/status', adminController.updateUserStatus);

// Event management
router.get('/events', adminController.getAllEvents);
router.delete('/events/:eventId', adminController.deleteEvent);

// Security logs
router.get('/logs', adminController.getLogs);

// System health
router.get('/system-health', adminController.getSystemHealth);

module.exports = router;
