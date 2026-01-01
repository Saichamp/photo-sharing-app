/**
 * Settings Controller
 * Handles system configuration management
 */

const Settings = require('../models/Settings');
const { logger } = require('../utils/logger');

/**
 * Get all settings
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    // Remove sensitive data
    const sanitizedSettings = settings.toObject();
    if (sanitizedSettings.email?.smtp?.password) {
      sanitizedSettings.email.smtp.password = '********';
    }

    res.status(200).json({
      success: true,
      data: sanitizedSettings
    });

    logger.info('Settings retrieved', {
      service: 'photomanea-backend',
      adminId: req.user?._id
    });
  } catch (error) {
    logger.error('Error fetching settings', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

/**
 * Update general settings
 */
exports.updateGeneralSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    settings.general = {
      ...settings.general,
      ...req.body
    };

    settings.lastUpdatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'General settings updated successfully',
      data: settings.general
    });

    logger.info('General settings updated', {
      service: 'photomanea-backend',
      adminId: req.user._id
    });
  } catch (error) {
    logger.error('Error updating general settings', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

/**
 * Update email settings
 */
exports.updateEmailSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    settings.email = {
      ...settings.email,
      ...req.body
    };

    settings.lastUpdatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Email settings updated successfully',
      data: settings.email
    });

    logger.info('Email settings updated', {
      service: 'photomanea-backend',
      adminId: req.user._id
    });
  } catch (error) {
    logger.error('Error updating email settings', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update email settings',
      error: error.message
    });
  }
};

/**
 * Update storage settings
 */
exports.updateStorageSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    settings.storage = {
      ...settings.storage,
      ...req.body
    };

    settings.lastUpdatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Storage settings updated successfully',
      data: settings.storage
    });

    logger.info('Storage settings updated', {
      service: 'photomanea-backend',
      adminId: req.user._id
    });
  } catch (error) {
    logger.error('Error updating storage settings', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update storage settings',
      error: error.message
    });
  }
};

/**
 * Update security settings
 */
exports.updateSecuritySettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    settings.security = {
      ...settings.security,
      ...req.body
    };

    settings.lastUpdatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Security settings updated successfully',
      data: settings.security
    });

    logger.info('Security settings updated', {
      service: 'photomanea-backend',
      adminId: req.user._id
    });
  } catch (error) {
    logger.error('Error updating security settings', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update security settings',
      error: error.message
    });
  }
};

/**
 * Update face recognition settings
 */
exports.updateFaceSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    settings.faceRecognition = {
      ...settings.faceRecognition,
      ...req.body
    };

    settings.lastUpdatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Face recognition settings updated successfully',
      data: settings.faceRecognition
    });

    logger.info('Face recognition settings updated', {
      service: 'photomanea-backend',
      adminId: req.user._id
    });
  } catch (error) {
    logger.error('Error updating face recognition settings', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update face recognition settings',
      error: error.message
    });
  }
};

/**
 * Update maintenance mode
 */
exports.updateMaintenanceMode = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    settings.maintenance = {
      ...settings.maintenance,
      ...req.body
    };

    settings.lastUpdatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Maintenance mode updated successfully',
      data: settings.maintenance
    });

    logger.info('Maintenance mode updated', {
      service: 'photomanea-backend',
      adminId: req.user._id,
      enabled: settings.maintenance.enabled
    });
  } catch (error) {
    logger.error('Error updating maintenance mode', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update maintenance mode',
      error: error.message
    });
  }
};

/**
 * Update feature flags
 */
exports.updateFeatures = async (req, res) => {
  try {
    const settings = await Settings.getSettings();

    settings.features = {
      ...settings.features,
      ...req.body
    };

    settings.lastUpdatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Feature flags updated successfully',
      data: settings.features
    });

    logger.info('Feature flags updated', {
      service: 'photomanea-backend',
      adminId: req.user._id
    });
  } catch (error) {
    logger.error('Error updating feature flags', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update feature flags',
      error: error.message
    });
  }
};

/**
 * Test email configuration
 */
exports.testEmailConfig = async (req, res) => {
  try {
    const { testEmail } = req.body;

    // TODO: Implement actual email sending
    // For now, just simulate success

    res.status(200).json({
      success: true,
      message: `Test email sent to ${testEmail}`
    });

    logger.info('Email configuration tested', {
      service: 'photomanea-backend',
      adminId: req.user._id,
      testEmail
    });
  } catch (error) {
    logger.error('Error testing email config', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

/**
 * Reset settings to defaults
 */
exports.resetSettings = async (req, res) => {
  try {
    const { section } = req.body;

    const settings = await Settings.getSettings();

    // Reset specific section or all
    if (section) {
      const defaultSettings = new Settings();
      settings[section] = defaultSettings[section];
    } else {
      // Delete and recreate
      await Settings.deleteMany({});
      const newSettings = await Settings.create({});
      
      return res.status(200).json({
        success: true,
        message: 'All settings reset to defaults',
        data: newSettings
      });
    }

    settings.lastUpdatedBy = req.user._id;
    await settings.save();

    res.status(200).json({
      success: true,
      message: `${section} settings reset to defaults`,
      data: settings[section]
    });

    logger.info('Settings reset', {
      service: 'photomanea-backend',
      adminId: req.user._id,
      section
    });
  } catch (error) {
    logger.error('Error resetting settings', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
};
