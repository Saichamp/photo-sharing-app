const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const photoController = require('../controllers/photoController');

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/photos/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(new Error('Only image files allowed!'), false);
    }
    cb(null, true);
  }
});

// Routes
router.post('/upload', upload.array('photos', 50), photoController.uploadPhotos); // Max 50 photos
router.get('/event/:eventId', photoController.getEventPhotos);
router.get('/status/:eventId', photoController.getProcessingStatus);
router.post('/search', photoController.searchUserPhotos);

module.exports = router;
