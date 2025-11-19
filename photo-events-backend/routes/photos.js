/**
 * Photo Routes for PhotoManEa
 * Handles photo upload, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const { authenticate, optionalAuth, checkQuota } = require('../middleware/authenticate');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateObjectIdParam } = require('../utils/validators');
const upload = require('../middleware/upload');

/**
 * @route   POST /api/photos/upload
 * @desc    Upload photos to an event
 * @access  Private (Event owner only)
 * @rateLimit 50 uploads per hour
 */
router.post(
  '/upload',
  authenticate,
  checkQuota('storage'),
  uploadLimiter,
  upload.array('photos', 100), // Max 100 photos per upload
  photoController.uploadPhotos
);

/**
 * @route   GET /api/photos/event/:eventId
 * @desc    Get all photos for an event
 * @access  Private (Event owner) or Public with valid registration
 */
router.get(
  '/event/:eventId',
  optionalAuth,
  validateObjectIdParam('eventId'),
  photoController.getEventPhotos
);

/**
 * @route   GET /api/photos/:id
 * @desc    Get single photo by ID
 * @access  Private or Public with registration
 */
router.get(
  '/:id',
  optionalAuth,
  validateObjectIdParam('id'),
  photoController.getPhotoById
);

/**
 * @route   DELETE /api/photos/:id
 * @desc    Delete photo
 * @access  Private (Event owner only)
 */
router.delete(
  '/:id',
  authenticate,
  validateObjectIdParam('id'),
  photoController.deletePhoto
);

/**
 * @route   POST /api/photos/process/:photoId
 * @desc    Manually trigger face processing for a photo
 * @access  Private (Event owner only)
 */
router.post(
  '/process/:photoId',
  authenticate,
  validateObjectIdParam('photoId'),
  photoController.processPhotoFaces
);

/**
 * @route   GET /api/photos/event/:eventId/stats
 * @desc    Get photo statistics for an event
 * @access  Private (Event owner only)
 */
router.get(
  '/event/:eventId/stats',
  authenticate,
  validateObjectIdParam('eventId'),
  photoController.getPhotoStats
);

module.exports = router;
