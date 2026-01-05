const express = require('express');
const router = express.Router();

const photoController = require('../controllers/photoController');
const { authenticate } = require('../middleware/authenticate');
const { uploadPhotos, handleMulterError } = require('../middleware/upload');

/**
 * Photo Upload Routes
 */

// Upload photos to event
router.post(
  '/upload',
  authenticate,
  uploadPhotos.array('photos'),
  handleMulterError,
  photoController.uploadPhotos
);

/**
 * Photo Retrieval Routes
 */

// Get all photos for event (no pagination - for preview page)
router.get('/event/:eventId/all', authenticate, photoController.getAllEventPhotos);

// Get photos for event (paginated - for public gallery)
router.get('/event/:eventId', photoController.getEventPhotos);

// Get photo statistics for event
router.get('/event/:eventId/stats', authenticate, photoController.getPhotoStats);

// Get single photo by ID
router.get('/:id', photoController.getPhotoById);

/**
 * Photo Processing Routes
 */

// Manually trigger face processing for a photo
router.post('/process/:photoId', authenticate, photoController.processPhotoFaces);

// Trigger batch matching for all photos in event
router.post('/event/:eventId/batch-match', authenticate, photoController.triggerBatchMatching);

/**
 * Photo Matching Routes (for guests)
 */

// Get matched photos for a guest registration
router.get('/matches/:registrationId', photoController.getMatchedPhotos);

// Find matches using face recognition (alternative endpoint)
router.post('/find-matches', photoController.findGuestPhotos);

/**
 * Photo Management Routes
 */

// Delete a photo
router.delete('/:id', authenticate, photoController.deletePhoto);

module.exports = router;
