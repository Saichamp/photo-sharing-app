const express = require('express');
const router = express.Router();
const { 
  upload, 
  testFaceMatching, 
  findMatchingPhotos,
  findPhotosForRegistration
} = require('../controllers/faceMatchingController');

// GET /api/face-matching/test - Test endpoint
router.get('/test', testFaceMatching);

// POST /api/face-matching/find-photos - Find matching photos using NEW selfie upload
router.post('/find-photos', upload.single('selfie'), findMatchingPhotos);

// POST /api/face-matching/find-by-registration - Find photos for existing registration
router.post('/find-by-registration', findPhotosForRegistration);


module.exports = router;
