const Registration = require('../models/Registration');
const Photo = require('../models/Photo');
const Event = require('../models/Event');
const faceRecognitionService = require('../services/faceRecognition/faceRecognitionWrapper');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Simple test endpoint
const testFaceMatching = async (req, res) => {
  res.json({
    message: '🤖 Face matching service is ready!',
    status: 'active',
    timestamp: new Date(),
    features: [
      'Face detection',
      'Face comparison', 
      'Photo grouping',
      'High accuracy matching'
    ]
  });
};

// Process selfie and find matching photos
const findMatchingPhotos = async (req, res) => {
  try {
    const { eventId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No selfie image provided' });
    }

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    console.log('🤳 Processing selfie for face matching...');
    console.log('📅 Event ID:', eventId);

    // Step 1: Save uploaded selfie temporarily
    const tempDir = path.join(__dirname, '../temp');
    await fs.ensureDir(tempDir);
    
    const selfieFilename = `selfie_${Date.now()}.jpg`;
    const selfiePath = path.join(tempDir, selfieFilename);
    
    // Process and save the selfie image
    await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(selfiePath);

    console.log('💾 Selfie saved temporarily:', selfiePath);

    // Step 2: Extract face embedding from selfie
    const selfieEmbedding = await faceRecognitionService.extractFaceEmbedding(selfiePath);
    
    if (!selfieEmbedding.success) {
      // Clean up temp file
      await fs.remove(selfiePath);
      return res.status(400).json({
        error: 'Could not detect face in selfie',
        details: selfieEmbedding.error
      });
    }

    // Step 3: For now, return mock results (we'll add real photo matching later)
    const mockMatches = [
      {
        photoId: 'photo_123',
        imageUrl: 'https://via.placeholder.com/400x300',
        confidence: 0.85,
        faceIndex: 0,
        boundingBox: { x: 100, y: 50, width: 150, height: 200 }
      },
      {
        photoId: 'photo_124', 
        imageUrl: 'https://via.placeholder.com/400x300',
        confidence: 0.78,
        faceIndex: 0,
        boundingBox: { x: 120, y: 60, width: 140, height: 180 }
      }
    ];

    // Clean up temp file
    await fs.remove(selfiePath);

    const response = {
      success: true,
      message: '🎉 Face matching completed successfully!',
      selfieProcessed: true,
      totalPhotosScanned: 25, // Mock number
      matchesFound: mockMatches.length,
      matches: mockMatches,
      processingTime: Date.now()
    };

    console.log(`🎉 Face matching completed! Found ${mockMatches.length} matches`);
    res.json(response);

  } catch (error) {
    console.error('❌ Face matching error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Find photos for an already-registered user
 * Uses the saved face embedding from registration
 */
const findPhotosForRegistration = async (req, res) => {
  try {
    const { registrationId } = req.body;

    if (!registrationId) {
      return res.status(400).json({ error: 'Registration ID is required' });
    }

    console.log('🔍 Finding photos for registration:', registrationId);

    // Get registration with face embedding
    const registration = await Registration.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    if (!registration.faceEmbedding) {
      return res.status(400).json({ 
        error: 'No face data found. Please register with a selfie.' 
      });
    }

    console.log('✅ Registration found:', registration.name);
    console.log('📊 Face embedding length:', registration.faceEmbedding.length);

    // Get all processed photos for this event
    const photos = await Photo.find({
      eventId: registration.eventId,
      processed: true,
      'faces.0': { $exists: true }
    });

    console.log(`📸 Found ${photos.length} processed photos with faces`);

    if (photos.length === 0) {
      return res.json({
        success: true,
        message: 'No photos uploaded yet for this event',
        matches: [],
        totalPhotos: 0,
        totalMatches: 0,
        guestName: registration.name
      });
    }

    // Prepare photos with face data for matching
    const eventPhotos = photos.map(photo => ({
      id: photo._id.toString(),
      url: photo.url,
      filename: photo.filename,
      uploadedAt: photo.uploadedAt,
      faces: photo.faces
    }));

    console.log(`🤖 Matching against ${eventPhotos.length} photos...`);

    // Use face recognition service to find matches
 // Use face recognition service to find matches
const matchResult = await faceRecognitionService.findMatchingPhotos(
  registration.faceEmbedding,
  eventPhotos
);


    if (!matchResult.success) {
      throw new Error(matchResult.error || 'Face matching failed');
    }

    console.log(`✨ Found ${matchResult.total_matches} matches`);

    // Enhance results with photo details
    const matchedPhotos = matchResult.matched_photos.map(match => {
      const photo = photos.find(p => p._id.toString() === match.photo_id);
      return {
        photoId: match.photo_id,
        url: photo?.url,
        filename: photo?.filename,
        uploadedAt: photo?.uploadedAt,
        similarity: match.similarity,
        faceIndex: match.face_index,
        distance: match.distance
      };
    });

    // Sort by similarity (highest first)
    matchedPhotos.sort((a, b) => b.similarity - a.similarity);

    res.json({
      success: true,
      message: `Found ${matchedPhotos.length} photos containing you!`,
      matches: matchedPhotos,
      totalPhotos: photos.length,
      totalMatches: matchedPhotos.length,
      guestName: registration.name,
      eventId: registration.eventId
    });

  } catch (error) {
    console.error('❌ Find photos error:', error);
    res.status(500).json({ 
      error: 'Failed to find matching photos',
      details: error.message 
    });
  }
};

module.exports = {
  upload,
  testFaceMatching,
  findMatchingPhotos,
  findPhotosForRegistration
};
