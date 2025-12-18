// backend/routes/admin.js
const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate'); // you already use this
const adminAuth = require('../middleware/adminAuth');

// All routes here require auth + admin role
router.use(authenticate, adminAuth);

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);
router.patch('/users/:id/subscription', adminController.updateSubscription);
router.delete('/users/:id', adminController.deleteUser);

router.get('/stats', adminController.getDashboardStats);

module.exports = router;
