const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const registrationController = require('../controllers/registrationController');

// ✅ Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/faces/');  // Make sure this folder exists!
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'selfie-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ✅ POST - Register for event (with selfie upload)
router.post('/', upload.single('selfie'), registrationController.registerForEvent);

// GET - Get registrations for event
router.get('/:eventId', registrationController.getEventRegistrations);

// GET - Get single registration
router.get('/registration/:registrationId', registrationController.getRegistration);

// DELETE - Delete registration
router.delete('/:registrationId', registrationController.deleteRegistration);

module.exports = router;
