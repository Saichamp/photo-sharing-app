const express = require('express');
const router = express.Router();
const { uploadPhotos, getEventPhotos } = require('../controllers/photoController');
const { uploadMultiple } = require('../middleware/upload');

// POST /api/photos/upload - Upload multiple photos
router.post('/upload', uploadMultiple, uploadPhotos);

// GET /api/photos/:eventId - Get all photos for event
router.get('/:eventId', getEventPhotos);

module.exports = router;
