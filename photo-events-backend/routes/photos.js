/**
 * Photo Routes for PhotoManEa
 * Handles photo uploads and management
 */

const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const { authenticate } = require('../middleware/authenticate');
const { uploadPhotos, handleMulterError } = require('../middleware/upload'); // ✅ FIXED: Destructured import

/**
 * @route   POST /api/photos/upload
 * @desc    Upload photos to an event (bulk upload)
 * @access  Private (requires authentication)
 */
router.post(
  '/upload',
  authenticate,
  uploadPhotos.array('photos', 100), // ✅ FIXED: Use uploadPhotos for multiple files
  handleMulterError, // ✅ ADDED: Handle multer errors
  photoController.uploadPhotos
);

/**
 * @route   GET /api/photos/event/:eventId
 * @desc    Get all photos for an event
 * @access  Private or Public with registration
 */
router.get(
  '/event/:eventId',
  photoController.getEventPhotos
);

/**
 * @route   GET /api/photos/event/:eventId/stats
 * @desc    Get photo statistics for an event
 * @access  Private (requires authentication)
 */
router.get(
  '/event/:eventId/stats',
  authenticate,
  photoController.getPhotoStats
);

/**
 * @route   GET /api/photos/matches/:registrationId
 * @desc    Get photos matched to a specific registration (guest gallery)
 * @access  Public
 */
router.get(
  '/matches/:registrationId',
  photoController.getMatchedPhotos
);

/**
 * @route   GET /api/photos/:id
 * @desc    Get single photo by ID
 * @access  Private or Public
 */
router.get(
  '/:id',
  photoController.getPhotoById
);

/**
 * @route   DELETE /api/photos/:id
 * @desc    Delete a photo
 * @access  Private (requires authentication)
 */
router.delete(
  '/:id',
  authenticate,
  photoController.deletePhoto
);

/**
 * @route   POST /api/photos/process/:photoId
 * @desc    Manually trigger face processing for a photo
 * @access  Private (requires authentication)
 */
router.post(
  '/process/:photoId',
  authenticate,
  photoController.processPhotoFaces
);

/**
 * @route   POST /api/photos/batch-match/:eventId
 * @desc    Trigger batch face matching for all photos in an event
 * @access  Private (requires authentication)
 */
router.post(
  '/batch-match/:eventId',
  authenticate,
  photoController.triggerBatchMatching
);
router.post('/find-matches', photoController.findGuestPhotos);

module.exports = router;
