const express = require('express');
const router = express.Router();
const { upload, testFaceMatching, findMatchingPhotos } = require('../controllers/faceMatchingController');

// GET /api/face-matching/test - Test endpoint
router.get('/test', testFaceMatching);

// POST /api/face-matching/find-photos - Find matching photos using selfie
router.post('/find-photos', upload.single('selfie'), findMatchingPhotos);

module.exports = router;
