/**
 * Settings Routes
 */

const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/authenticate');

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  next();
};

// Debug: Check if controller functions exist
console.log('Settings Controller Functions:', Object.keys(settingsController));

// Get all settings
router.get('/', protect, isAdmin, settingsController.getSettings);

// Update settings by section
router.put('/general', protect, isAdmin, settingsController.updateGeneralSettings);
router.put('/email', protect, isAdmin, settingsController.updateEmailSettings);
router.put('/storage', protect, isAdmin, settingsController.updateStorageSettings);
router.put('/security', protect, isAdmin, settingsController.updateSecuritySettings);
router.put('/face-recognition', protect, isAdmin, settingsController.updateFaceSettings);
router.put('/maintenance', protect, isAdmin, settingsController.updateMaintenanceMode);
router.put('/features', protect, isAdmin, settingsController.updateFeatures);

// Test email configuration
router.post('/email/test', protect, isAdmin, settingsController.testEmailConfig);

// Reset settings
router.post('/reset', protect, isAdmin, settingsController.resetSettings);

module.exports = router;
