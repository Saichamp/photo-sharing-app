/**
 * Admin Routes
 * Routes for admin operations
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/authenticate');

// Apply authentication and admin middleware to ALL routes
router.use(authenticate);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', adminController.getStats);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:userId', adminController.updateUser);              // ✅ NEW
router.patch('/users/:userId/status', adminController.updateUserStatus);
router.delete('/users/:userId', adminController.deleteUser);
router.post('/users/:userId/reset-password', adminController.resetUserPassword); // ✅ NEW

// Event management
router.get('/events', adminController.getAllEvents);
router.delete('/events/:eventId', adminController.deleteEvent);

// Security logs
router.get('/logs', adminController.getLogs);

// System health
router.get('/system-health', adminController.getSystemHealth);
router.put('/users/:userId', adminController.updateUser);
router.post('/users/:userId/reset-password', adminController.resetUserPassword);


// Get all events (admin)
router.get('/events', adminController.getAllEvents);

// Update event
router.put('/events/:eventId', adminController.updateEvent);

// Delete event
router.delete('/events/:eventId', adminController.deleteEvent);

// Get all photos (admin)
router.get('/photos', adminController.getAllPhotos);

// Delete photo
router.delete('/photos/:photoId', adminController.deletePhoto);

// Bulk delete photos
router.post('/photos/bulk-delete', adminController.bulkDeletePhotos);

// Analytics routes
router.get('/analytics', adminController.getAnalytics);
router.get('/recent-activity', adminController.getRecentActivity);

module.exports = router;
