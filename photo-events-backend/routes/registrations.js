const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const registrationController = require('../controllers/registrationController');

// Configure multer for selfie uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/faces/'); // Make sure this folder exists!
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'selfie-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Routes
// POST /api/registrations - Register with optional selfie upload
router.post('/', upload.single('selfie'), registrationController.registerForEvent);

// GET /api/registrations/event/:eventId - Get all registrations for an event
router.get('/event/:eventId', registrationController.getEventRegistrations);

// GET /api/registrations/:registrationId - Get single registration
router.get('/:registrationId', registrationController.getRegistration);

// DELETE /api/registrations/:registrationId - Delete registration
router.delete('/:registrationId', registrationController.deleteRegistration);

module.exports = router;
