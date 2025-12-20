/**
 * Admin routes - /api/admin/*
 */

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { authenticate, restrictTo } = require('../middleware/authenticate');
const adminAuth = require('../middleware/adminAuth');

// Apply authentication and admin check to ALL routes in this file
router.use(authenticate);
router.use(adminAuth);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);
router.patch('/users/:id/subscription', adminController.updateSubscription);
router.delete('/users/:id', adminController.deleteUser);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

module.exports = router;
