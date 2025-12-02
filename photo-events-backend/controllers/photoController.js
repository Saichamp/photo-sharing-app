/**
 * Photo Controller for PhotoManEa
 * Handles photo upload and management with access control
 */
const mongoose = require('mongoose');

const fs = require('fs').promises;
const path = require('path');
const Photo = require('../models/Photo');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { AppError, asyncHandler, successResponse } = require('../middleware/errorHandler');
const { logFile, logAI, logger } = require('../utils/logger');
const faceRecognitionService = require('../services/faceRecognition/faceRecognitionWrapper');
const { isValidObjectId } = require('../utils/validators');





/**
 * @desc    Upload photos to an event
 * @route   POST /api/photos/upload
 * @access  Private
 */

exports.uploadPhotos = asyncHandler(async (req, res, next) => {
  const { eventId } = req.body;

  // 1. Validate Request
  if (!eventId) throw new AppError('Event ID is required', 400);
  if (!isValidObjectId(eventId)) throw new AppError('Invalid event ID format', 400);
  if (!req.files || req.files.length === 0) throw new AppError('No photos uploaded', 400);

  // 2. Find Event (THIS WAS MISSING/UNDEFINED IN YOUR EDIT)
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);

  // 3. Check Permission
  if (event.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to upload photos to this event', 403);
  }

  const createdPhotos = [];
  const errors = [];
  let totalUploadedSize = 0;

  // 4. Process Files Safely
  for (const file of req.files) {
    try {
      // ✅ NEW (fixes Windows paths):
const relativePath = file.path.replace(/\\/g, '/').replace(/^uploads[\\/]/, '');
const url = `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;

      
      const photo = await Photo.create({
        eventId,
        userId: req.user._id,
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        url: url,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        processed: false,
        faces: []
      });

      createdPhotos.push(photo);
      totalUploadedSize += file.size;

      // Background Processing
      setImmediate(async () => {
        try {
          const result = await faceRecognitionService.extractFaces(photo.path);
          if (result.success && result.faces && result.faces.length > 0) {
            photo.faces = result.faces;
            photo.processed = true;
            await photo.save();
            await matchPhotoWithRegistrations(photo, eventId); // Defined lower in file
          } else {
            photo.processed = true;
            photo.processingError = 'No faces detected';
            await photo.save();
          }
        } catch (error) {
          logger.error('Background processing failed', { photoId: photo._id, error: error.message });
          photo.processed = true;
          photo.processingError = error.message;
          await photo.save();
        }
      });

    } catch (err) {
      console.error(`Failed to save photo ${file.originalname}:`, err);
      errors.push({ file: file.originalname, error: err.message });
      // Cleanup orphaned file
      await fs.unlink(file.path).catch(() => {}); 
    }
  }

  // 5. Update Stats (Now 'event' is defined!)
 // 5. Update Stats
if (totalUploadedSize > 0) {
  // ✅ FIXED: Pass photo count as second parameter
  if (typeof event.incrementPhotoStats === 'function') {
    await event.incrementPhotoStats(totalUploadedSize, createdPhotos.length);
  } else {
    // Fallback manual update if method missing
    event.photosUploaded = (event.photosUploaded || 0) + createdPhotos.length;
    event.storageUsed = (event.storageUsed || 0) + totalUploadedSize;
    await event.save();
  }

  // Update user quota
  if (req.user && typeof req.user.incrementStorageUsage === 'function') {
    await req.user.incrementStorageUsage(totalUploadedSize);
  }
}

console.log(`✅ Updated event stats: ${createdPhotos.length} photos added`); // ✅ Add logging

successResponse(res, {
  photos: createdPhotos.map(p => ({ id: p._id, filename: p.filename })),
  uploaded: createdPhotos.length,
  failed: errors.length,
  errors
}, 'Photos processed', 201);


  successResponse(res, {
    photos: createdPhotos.map(p => ({ id: p._id, filename: p.filename })),
    uploaded: createdPhotos.length,
    failed: errors.length,
    errors
  }, 'Photos processed', 201);
});


/**
 * @desc    Get all photos for an event
 * @route   GET /api/photos/event/:eventId
 * @access  Private or Public with registration
 */
exports.getEventPhotos = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  // Validate eventId format
  if (!isValidObjectId(eventId)) {
    throw new AppError('Invalid event ID format', 400);
  }
  
  // Verify event exists
  const event = await Event.findById(eventId);
  
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  
  // Check access:
  // 1. Event owner (authenticated user)
  // 2. Registered guest (check registration)
  let hasAccess = false;
  
  if (req.user && event.userId.toString() === req.user._id.toString()) {
    hasAccess = true; // Event owner
  }
  
  // For guests, we'll verify registration in face-matching route
  // For now, allow public access (we'll restrict in Phase 3)
  hasAccess = true;
  
  // Get photos
  const skip = (page - 1) * limit;
  const photos = await Photo.find({ eventId, processed: true })
    .select('-faces') // Don't send face embeddings
    .sort('-uploadedAt')
    .limit(parseInt(limit))
    .skip(skip);
  
  const total = await Photo.countDocuments({ eventId, processed: true });
  
  successResponse(res, {
    photos,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  }, 'Photos retrieved successfully');
});

/**
 * @desc    Get single photo by ID
 * @route   GET /api/photos/:id
 * @access  Private or Public
 */
exports.getPhotoById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Validate photo ID
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid photo ID', 400);
  }
  
  const photo = await Photo.findById(id).select('-faces');
  
  if (!photo) {
    throw new AppError('Photo not found', 404);
  }
  
  // Verify access
  const event = await Event.findById(photo.eventId);
  
  if (!event) {
    throw new AppError('Associated event not found', 404);
  }
  
  // Check if user owns the event
  if (req.user && event.userId.toString() === req.user._id.toString()) {
    // Owner has full access
    successResponse(res, photo, 'Photo retrieved successfully');
  } else {
    // Public access - limited info
    successResponse(res, {
      id: photo._id,
      filename: photo.filename,
      path: photo.path,
      uploadedAt: photo.uploadedAt
    }, 'Photo retrieved successfully');
  }
});

/**
 * @desc    Delete photo
 * @route   DELETE /api/photos/:id
 * @access  Private
 */
exports.deletePhoto = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Validate photo ID
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid photo ID', 400);
  }
  
  const photo = await Photo.findById(id);
  
  if (!photo) {
    throw new AppError('Photo not found', 404);
  }
  
  // Verify event ownership
  const event = await Event.findById(photo.eventId);
  
  if (!event) {
    throw new AppError('Associated event not found', 404);
  }
  
  if (event.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to delete this photo', 403);
  }
  
  // Delete file from disk
  try {
    await fs.unlink(photo.path);
    logFile('delete', photo.filename, { photoId: photo._id });
  } catch (error) {
    logger.error('Failed to delete photo file', { 
      photoId: photo._id, 
      error: error.message 
    });
    // Do not fail deletion purely because file is missing
  }
  
  const photoSize = photo.size || 0;
  
  // Update event statistics
  event.photosUploaded = Math.max(0, (event.photosUploaded || 0) - 1);
  event.storageUsed = Math.max(0, (event.storageUsed || 0) - photoSize);
  await event.save();
  
  // Update user storage
  if (req.user && typeof req.user.decrementStorageUsage === 'function') {
    await req.user.decrementStorageUsage(photoSize);
  } else if (req.user && req.user.quota) {
    req.user.quota.storageUsed = Math.max(
      0,
      (req.user.quota.storageUsed || 0) - photoSize
    );
    await req.user.save();
  }
  
  // Delete photo record
  await photo.deleteOne();
  
  logger.info('Photo deleted', {
    userId: req.user._id,
    photoId: photo._id,
    eventId: event._id
  });
  
  successResponse(res, null, 'Photo deleted successfully');
});

/**
 * @desc    Manually trigger face processing
 * @route   POST /api/photos/process/:photoId
 * @access  Private
 */
exports.processPhotoFaces = asyncHandler(async (req, res, next) => {
  const { photoId } = req.params;
  
  // Validate photo ID
  if (!isValidObjectId(photoId)) {
    throw new AppError('Invalid photo ID', 400);
  }
  
  const photo = await Photo.findById(photoId);
  
  if (!photo) {
    throw new AppError('Photo not found', 404);
  }
  
  // Verify ownership
  const event = await Event.findById(photo.eventId);
  
  if (!event || event.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to process this photo', 403);
  }
  
  // Process faces
  try {
    const result = await faceRecognitionService.extractFaces(photo.path);
    
    if (result.success && result.facesDetected > 0) {
      photo.faces = result.faces;
      photo.processed = true;
      photo.processingError = null;
      await photo.save();
      
      logAI('face-extraction', {
        photoId: photo._id,
        facesDetected: result.facesDetected
      });
      
      // Trigger face matching after manual processing
      await matchPhotoWithRegistrations(photo, photo.eventId);
      
      successResponse(res, {
        photoId: photo._id,
        facesDetected: result.facesDetected,
        processingTime: result.processingTime
      }, 'Photo processed successfully');
    } else {
      photo.processed = true;
      photo.processingError = 'No faces detected';
      await photo.save();
      
      successResponse(res, {
        photoId: photo._id,
        facesDetected: 0,
        message: 'No faces detected in photo'
      }, 'Photo processed (no faces found)');
    }
  } catch (error) {
    photo.processed = true;
    photo.processingError = error.message;
    await photo.save();
    
    throw new AppError('Face processing failed: ' + error.message, 500);
  }
});

/**
 * @desc    Get photo statistics for an event
 * @route   GET /api/photos/event/:eventId/stats
 * @access  Private
 */
exports.getPhotoStats = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  
  // Validate eventId
  if (!isValidObjectId(eventId)) {
    throw new AppError('Invalid event ID', 400);
  }
  
  // Verify ownership
  const event = await Event.findById(eventId);
  
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  
  if (event.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to view these statistics', 403);
  }
  
  // Get statistics
  const totalPhotos = await Photo.countDocuments({ eventId });
  const processedPhotos = await Photo.countDocuments({ eventId, processed: true });
  const photosWithFaces = await Photo.countDocuments({ 
    eventId, 
    processed: true,
    'faces.0': { $exists: true }
  });
  
  // Calculate total faces
  const faceAggregation = await Photo.aggregate([
    { $match: { eventId: event._id, processed: true } },
    { $project: { faceCount: { $size: { $ifNull: ['$faces', []] } } } },
    { $group: { _id: null, totalFaces: { $sum: '$faceCount' } } }
  ]);
  
  const totalFaces = faceAggregation.length > 0 ? faceAggregation[0].totalFaces : 0;
  
  const stats = {
    eventId: event._id,
    eventName: event.name,
    totalPhotos,
    processedPhotos,
    photosWithFaces,
    totalFaces,
    storageUsed: event.storageUsedMB ? event.storageUsedMB + ' MB' : undefined,
    processingProgress: totalPhotos > 0 ? Math.round((processedPhotos / totalPhotos) * 100) : 0
  };
  
  successResponse(res, stats, 'Photo statistics retrieved successfully');
});

/**
 * ✅ NEW: Face matching helper
 * Matches faces in a photo with registered users
 */
async function matchPhotoWithRegistrations(photo, eventId) {
  try {
    const config = require('../config/config'); // ← ADD THIS
    
    // Get all registrations with face embeddings for this event
    const registrations = await Registration.find({
      eventId,
      faceEmbedding: { $exists: true, $ne: null }
    });

    if (registrations.length === 0 || !photo.faces || photo.faces.length === 0) {
      return;
    }

    // Match each face in photo with each registration
    const matches = [];
    for (const registration of registrations) {
      for (const photoFace of photo.faces) {
        // Calculate similarity between embeddings
        const similarity = calculateCosineSimilarity(
          registration.faceEmbedding,
          photoFace.embedding
        );

        const threshold = config.faceRecognition.matchThreshold; // ← CHANGED FROM 0.6

        if (similarity >= threshold) {
          matches.push({
            registrationId: registration._id,
            email: registration.email,
            similarity
          });
          logger.info('Face match found', {
            photoId: photo._id,
            registrationId: registration._id,
            email: registration.email,
            similarity: similarity.toFixed(3)
          });
        }
      }
    }

    // Store matches in photo document
    if (matches.length > 0) {
      photo.matches = matches;
      await photo.save();
    }

  } catch (error) {
    logger.error('Face matching failed', {
      photoId: photo._id,
      error: error.message
    });
  }
}


/**
 * ✅ Cosine similarity calculation
 * Calculates similarity between two face embeddings
 */
function calculateCosineSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Background face processing function (legacy support)
 */
async function processPhotoInBackground(photoId, photoPath) {
  try {
    const result = await faceRecognitionService.extractFaces(photoPath);
    
    if (result.success && result.facesDetected > 0) {
      const photo = await Photo.findByIdAndUpdate(
        photoId,
        {
          faces: result.faces,
          processed: true,
          processingError: null
        },
        { new: true }
      );
      
      logAI('face-extraction-background', {
        photoId,
        facesDetected: result.facesDetected,
        processingTime: result.processingTime
      });

      // Trigger face matching
      if (photo) {
        await matchPhotoWithRegistrations(photo, photo.eventId);
      }
    } else {
      await Photo.findByIdAndUpdate(photoId, {
        processed: true,
        processingError: 'No faces detected'
      });
    }
  } catch (error) {
    logger.error('Background face processing failed', {
      photoId,
      error: error.message
    });
    
    await Photo.findByIdAndUpdate(photoId, {
      processed: true,
      processingError: error.message
    });
  }
}

/**
 * @desc Get photos matched to a registration
 * @route GET /api/photos/matches/:registrationId
 * @access Public
 */
// OLD (line ~320)
/**
 * @desc Get photos matched to a registration
 * @route GET /api/photos/matches/:registrationId
 * @access Public
 */

 exports.getMatchedPhotos = asyncHandler(async (req, res, next) => {
  const { registrationId } = req.params;

  if (!isValidObjectId(registrationId)) {
    throw new AppError('Invalid registration ID', 400);
  }

  const registration = await Registration.findById(registrationId);
  if (!registration) {
    throw new AppError('Registration not found', 404);
  }

  logger.info('Fetching matched photos', {
    registrationId,
    eventId: registration.eventId,
    email: registration.email
  });

  // Convert to ObjectId for MongoDB query
  const regObjectId = new mongoose.Types.ObjectId(registrationId);

  const matchedPhotos = await Photo.find({
    eventId: registration.eventId,
    'matches.registrationId': regObjectId,
    processed: true
  })
  .select('filename url path uploadedAt matches size')
  .sort('-uploadedAt');

  logger.info('Matched photos retrieved', {
    registrationId,
    count: matchedPhotos.length
  });

  successResponse(res, {
    photos: matchedPhotos.map(p => ({
      id: p._id,
      url: p.url,
      filename: p.filename,
      uploadedAt: p.uploadedAt,
      similarity: p.matches.find(m => m.registrationId.toString() === registrationId)?.similarity
    })),
    count: matchedPhotos.length,
    guestName: registration.name,
    eventId: registration.eventId
  }, 'Matched photos retrieved successfully');
});
exports.triggerBatchMatching = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const photos = await Photo.find({ eventId, processed: true, 'faces.0': { $exists: true } });
  
  let matched = 0;
  for (const photo of photos) {
    await matchPhotoWithRegistrations(photo, eventId);
    if (photo.matches && photo.matches.length > 0) matched++;
  }

  successResponse(res, { 
    totalPhotos: photos.length, 
    photosWithMatches: matched 
  }, 'Batch matching completed');
});


/**
 * @desc Get matched photos for a guest (Phase 4)
 * @route POST /api/photos/find-matches
 * @access Public
 */
exports.findGuestPhotos = asyncHandler(async (req, res, next) => {
  const { registrationId } = req.body;

  if (!isValidObjectId(registrationId)) {
    throw new AppError('Invalid registration ID', 400);
  }

  // Get registration with face embedding
  const registration = await Registration.findById(registrationId);
  if (!registration) {
    throw new AppError('Registration not found', 404);
  }

  if (!registration.faceEmbedding) {
    throw new AppError('No face data found for this registration', 400);
  }

  // Get all event photos with faces
  const photos = await Photo.find({
    eventId: registration.eventId,
    processed: true,
    'faces.0': { $exists: true }
  }).select('_id faces url filename uploadedAt');

  if (photos.length === 0) {
    return successResponse(res, {
      photos: [],
      count: 0,
      message: 'No photos available yet'
    }, 'No photos found');
  }

  // Prepare photo data for matching
  const photoData = photos.map(p => ({
    id: p._id.toString(),
    faces: p.faces
  }));

  logger.info('Starting face matching', {
    registrationId,
    totalPhotos: photos.length,
    totalFaces: photoData.reduce((sum, p) => sum + p.faces.length, 0)
  });

  // Call Python service to find matches
  const result = await faceRecognitionService.findMatchingPhotos(
    registration.faceEmbedding,
    photoData
  );

  if (!result.success) {
    throw new AppError('Face matching failed: ' + result.error, 500);
  }

  // Get unique photo IDs from matches
  const matchedPhotoIds = [...new Set(
    result.matched_photos.map(m => m.photo_id)
  )];

  // Fetch full photo details
  const matchedPhotos = await Photo.find({
    _id: { $in: matchedPhotoIds }
  }).select('_id url filename uploadedAt size');

  logger.info('Matching complete', {
    registrationId,
    matchedPhotos: matchedPhotos.length,
    totalMatches: result.total_matches
  });

  successResponse(res, {
    photos: matchedPhotos.map(p => ({
      id: p._id,
      url: p.url,
      filename: p.filename,
      uploadedAt: p.uploadedAt,
      matches: result.matched_photos.filter(m => m.photo_id === p._id.toString())
    })),
    count: matchedPhotos.length,
    totalMatches: result.total_matches,
    guestName: registration.name
  }, 'Matched photos retrieved successfully');
});
