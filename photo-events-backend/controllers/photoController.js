const Photo = require('../models/Photo');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const faceService = require('../services/faceRecognitionService');
const path = require('path');
const fs = require('fs').promises;

/**
 * Upload photos for an event
 * POST /api/photos/upload
 */
const uploadPhotos = async (req, res) => {
  try {
    const { eventId } = req.body;
    const uploadedFiles = req.files; // Array of files from multer

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No photos uploaded'
      });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    console.log(`📸 Uploading ${uploadedFiles.length} photos for event ${eventId}`);

    // Save photo records to database (process faces in background)
    const photoRecords = [];

    for (const file of uploadedFiles) {
      const photo = new Photo({
        eventId,
        filename: file.filename,
        url: `/uploads/photos/${file.filename}`,
        processed: false // Will be processed in background
      });

      await photo.save();
      photoRecords.push(photo);

      // Process face detection in background (don't wait)
      processFacesInBackground(photo._id, file.path);
    }

    // Update event photo count
    event.photosUploaded = (event.photosUploaded || 0) + uploadedFiles.length;
    await event.save();

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} photos uploaded successfully`,
      data: {
        eventId,
        photosUploaded: uploadedFiles.length,
        photos: photoRecords.map(p => ({
          id: p._id,
          url: p.url,
          processed: p.processed
        }))
      }
    });

  } catch (error) {
    console.error('❌ Photo upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photos',
      error: error.message
    });
  }
};

/**
 * Background job to process faces in photo
 */
async function processFacesInBackground(photoId, filePath) {
  try {
    console.log(`🔍 Processing faces for photo ${photoId}...`);
    
    const startTime = Date.now();

    // Extract faces using Python service
    const result = await faceService.extractFaces(filePath);

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Update photo record with face data
    const photo = await Photo.findById(photoId);
    
    if (!photo) {
      console.error(`❌ Photo ${photoId} not found in database`);
      return;
    }

    photo.faces = result.faces;
    photo.processed = true;
    await photo.save();

    console.log(`✅ Photo ${photoId} processed: ${result.facesDetected} face(s) in ${processingTime}s`);

  } catch (error) {
    console.error(`❌ Face processing failed for photo ${photoId}:`, error.message);
    
    // Mark as processed with error
    try {
      await Photo.findByIdAndUpdate(photoId, {
        processed: true,
        processingError: error.message
      });
    } catch (updateError) {
      console.error('Failed to update photo with error:', updateError);
    }
  }
}

/**
 * Get all photos for an event
 * GET /api/photos/event/:eventId
 */
const getEventPhotos = async (req, res) => {
  try {
    const { eventId } = req.params;

    const photos = await Photo.find({ eventId })
      .select('-faces.embedding') // Don't send embeddings to frontend
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: photos.length,
      data: photos.map(p => ({
        id: p._id,
        url: p.url,
        processed: p.processed,
        facesDetected: p.faces ? p.faces.length : 0,
        uploadedAt: p.uploadedAt
      }))
    });

  } catch (error) {
    console.error('❌ Get photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch photos',
      error: error.message
    });
  }
};

/**
 * Get processing status
 * GET /api/photos/status/:eventId
 */
const getProcessingStatus = async (req, res) => {
  try {
    const { eventId } = req.params;

    const totalPhotos = await Photo.countDocuments({ eventId });
    const processedPhotos = await Photo.countDocuments({ eventId, processed: true });
    const photosWithFaces = await Photo.countDocuments({ 
      eventId, 
      processed: true,
      'faces.0': { $exists: true }
    });

    res.json({
      success: true,
      data: {
        totalPhotos,
        processedPhotos,
        pendingPhotos: totalPhotos - processedPhotos,
        photosWithFaces,
        processingComplete: totalPhotos === processedPhotos
      }
    });

  } catch (error) {
    console.error('❌ Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get processing status',
      error: error.message
    });
  }
};

/**
 * Search for user's photos
 * POST /api/photos/search
 */
const searchUserPhotos = async (req, res) => {
  try {
    const { registrationId, eventId, threshold } = req.body;

    if (!registrationId || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID and Event ID are required'
      });
    }

    console.log(`🔍 Searching photos for registration ${registrationId}...`);

    // Get user's face embedding
    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    if (!registration.faceEmbedding || !registration.faceProcessed) {
      return res.status(400).json({
        success: false,
        message: 'No face embedding found for this registration'
      });
    }

    // Get all processed photos for the event
    const photos = await Photo.find({
      eventId,
      processed: true,
      'faces.0': { $exists: true } // Photos with at least one face
    });

    console.log(`📸 Searching ${photos.length} photos with faces...`);

    // Build database of all face embeddings from photos
    const faceDatabase = [];
    for (const photo of photos) {
      for (const face of photo.faces) {
        faceDatabase.push({
          photoId: photo._id.toString(),
          faceIndex: face.faceIndex,
          embedding: face.embedding,
          boundingBox: face.boundingBox
        });
      }
    }

    console.log(`👤 Comparing against ${faceDatabase.length} total faces...`);

    // Search for matches
    const searchThreshold = threshold || 0.4;
    const startTime = Date.now();

    const matches = await faceService.searchFaces(
      registration.faceEmbedding,
      faceDatabase,
      searchThreshold
    );

    const searchTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Group matches by photo
    const matchedPhotoIds = [...new Set(matches.matches.map(m => m.photoId))];
    const matchedPhotos = await Photo.find({
      _id: { $in: matchedPhotoIds }
    }).select('-faces.embedding');

    // Add match details to each photo
    const results = matchedPhotos.map(photo => {
      const photoMatches = matches.matches.filter(m => m.photoId === photo._id.toString());
      return {
        photoId: photo._id,
        url: photo.url,
        uploadedAt: photo.uploadedAt,
        matches: photoMatches.map(m => ({
          faceIndex: m.faceIndex,
          confidence: m.confidence,
          boundingBox: m.boundingBox
        }))
      };
    });

    console.log(`✅ Search complete: Found ${matchedPhotoIds.length} photos in ${searchTime}s`);

    res.json({
      success: true,
      message: `Found ${matchedPhotoIds.length} photo(s) containing you`,
      data: {
        totalPhotosSearched: photos.length,
        totalFacesSearched: faceDatabase.length,
        matchesFound: matchedPhotoIds.length,
        searchTime: parseFloat(searchTime),
        photos: results
      }
    });

  } catch (error) {
    console.error('❌ Photo search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search photos',
      error: error.message
    });
  }
};

// Export all functions
exports.uploadPhotos = uploadPhotos;
exports.getEventPhotos = getEventPhotos;
exports.getProcessingStatus = getProcessingStatus;
exports.searchUserPhotos = searchUserPhotos;
