
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
 * ✅ PROCESSING QUEUE - Prevents CPU overload
 * Processes 2 photos at a time with cooling delay
 */
const processingQueue = [];
let activeProcessing = 0;
const MAX_CONCURRENT = 2; // Process 2 photos simultaneously

async function addToProcessingQueue(photo, eventId) {
  processingQueue.push({ photo, eventId });
  processNextInQueue();
}

async function processNextInQueue() {
  if (activeProcessing >= MAX_CONCURRENT || processingQueue.length === 0) {
    return;
  }

  activeProcessing++;
  const { photo, eventId } = processingQueue.shift();

  try {
    console.log(`🤖 Processing ${photo.filename} (${processingQueue.length} remaining, ${activeProcessing} active)`);

    const result = await faceRecognitionService.extractFaces(photo.path);

    if (result.success && result.faces && result.faces.length > 0) {
      const normalizedFaces = normalizeFaces(result.faces);
      photo.faces = normalizedFaces;
      photo.processed = true;
      photo.processingError = null;
      await photo.save();
      
      console.log(`✅ Found ${result.faces.length} faces in ${photo.filename}`);
      
      await matchPhotoWithRegistrations(photo, eventId);
    } else {
      photo.processed = true;
      photo.processingError = 'No faces detected';
      await photo.save();
      console.log(`⚠️ No faces in ${photo.filename}`);
    }

    // ✅ 1 second cooling delay
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    logger.error('Face processing failed', {
      photoId: photo._id,
      error: error.message,
    });
    photo.processed = true;
    photo.processingError = error.message;
    await photo.save();
  } finally {
    activeProcessing--;
    processNextInQueue();
  }
}

/**
 * Helper: normalize faces to match Photo FaceSchema
 */
function normalizeFaces(faces) {
  if (!Array.isArray(faces)) return [];

  return faces.map((face, idx) => ({
    faceIndex: face.faceIndex ?? idx,
    embedding: face.embedding,
    boundingBox: face.boundingBox || face.bbox,
    age: face.age ?? null,
    gender:
      face.gender === 'M' || face.gender === 'F'
        ? face.gender
        : face.gender === 1 || face.gender === '1'
        ? 'M'
        : face.gender === 0 || face.gender === '0'
        ? 'F'
        : null,
    confidence: face.confidence,
  }));
}

/**
 * @desc Upload photos to an event
 * @route POST /api/photos/upload
 * @access Private
 */
exports.uploadPhotos = asyncHandler(async (req, res, next) => {
  const { eventId } = req.body;

  // 1. Check Authentication
  if (!req.user || !req.user._id) {
    console.log('❌ Upload failed: req.user is undefined');
    throw new AppError('Authentication required. Please log in.', 401);
  }

  console.log('✅ Upload request from user:', req.user.email, '| ID:', req.user._id);

  // 2. Validate Request
  if (!eventId) throw new AppError('Event ID is required', 400);
  if (!isValidObjectId(eventId)) throw new AppError('Invalid event ID format', 400);
  if (!req.files || req.files.length === 0) throw new AppError('No photos uploaded', 400);

  console.log('📤 Uploading', req.files.length, 'photos to event:', eventId);

  // 3. Find Event
  const event = await Event.findById(eventId);
  if (!event) throw new AppError('Event not found', 404);

  // 4. Check Permission
  const eventOwnerId = event.userId || event.createdBy || event.organizer;

  if (!eventOwnerId) {
    console.error('❌ Event has no owner:', event);
    throw new AppError('Event owner information is missing', 500);
  }

  if (eventOwnerId.toString() !== req.user._id.toString()) {
    console.log('❌ Permission denied - Event owner:', eventOwnerId, '| User:', req.user._id);
    throw new AppError('You do not have permission to upload photos to this event', 403);
  }

  console.log('✅ Permission granted - User owns this event');

  const createdPhotos = [];
  const errors = [];
  let totalUploadedSize = 0;

  // 5. Process Files
  for (const file of req.files) {
    try {
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
        faces: [],
      });

      createdPhotos.push(photo);
      totalUploadedSize += file.size;

      console.log('✅ Photo saved:', file.filename, '| Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      // ✅ Add to processing queue (controlled processing)
      addToProcessingQueue(photo, eventId);

    } catch (err) {
      console.error(`❌ Failed to save photo ${file.originalname}:`, err);
      errors.push({ file: file.originalname, error: err.message });
      await fs.unlink(file.path).catch(() => {});
    }
  }

  // 6. Update Stats
  if (totalUploadedSize > 0) {
    if (typeof event.incrementPhotoStats === 'function') {
      await event.incrementPhotoStats(totalUploadedSize, createdPhotos.length);
    } else {
      event.photosUploaded = (event.photosUploaded || 0) + createdPhotos.length;
      event.storageUsed = (event.storageUsed || 0) + totalUploadedSize;
      await event.save();
    }

    if (req.user && typeof req.user.incrementStorageUsage === 'function') {
      await req.user.incrementStorageUsage(totalUploadedSize);
    }

    console.log(`✅ Updated event stats: ${createdPhotos.length} photos added | Total size: ${(totalUploadedSize / 1024 / 1024).toFixed(2)} MB`);
  }

  successResponse(
    res,
    {
      photos: createdPhotos.map((p) => ({ id: p._id, filename: p.filename, url: p.url })),
      uploaded: createdPhotos.length,
      failed: errors.length,
      errors,
      queueSize: processingQueue.length + activeProcessing,
      estimatedTime: `${Math.ceil((processingQueue.length + activeProcessing) * 3 / 60)} minutes`
    },
    'Photos uploaded successfully. Processing started.',
    201
  );
});
/**
 * @desc Get all photos for an event (with pagination)
 * @route GET /api/photos/event/:eventId
 * @access Private or Public with registration
 */
exports.getEventPhotos = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  if (!isValidObjectId(eventId)) {
    throw new AppError('Invalid event ID format', 400);
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const skip = (page - 1) * limit;
  const photos = await Photo.find({ eventId, processed: true })
    .select('-faces')
    .sort('-uploadedAt')
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Photo.countDocuments({ eventId, processed: true });

  successResponse(
    res,
    {
      photos,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    },
    'Photos retrieved successfully'
  );
});

/**
 * @desc Get ALL photos for preview page (includes unprocessed)
 * @route GET /api/photos/event/:eventId/all
 * @access Private
 */
exports.getAllEventPhotos = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  if (!isValidObjectId(eventId)) {
    throw new AppError('Invalid event ID format', 400);
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Check permission
  const eventOwnerId = event.userId || event.createdBy || event.organizer;
  
  if (!eventOwnerId) {
    throw new AppError('Event owner information is missing', 500);
  }

  if (req.user && eventOwnerId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to view these photos', 403);
  }

  // Get ALL photos (including unprocessed) - NO PAGINATION
  const photos = await Photo.find({ eventId })
    .select('_id filename url uploadedAt processed faces processingError matches size mimeType')
    .sort('-uploadedAt')
    .lean(); // Use lean for better performance

  // Calculate stats
  const stats = {
    total: photos.length,
    processed: photos.filter(p => p.processed).length,
    processing: photos.filter(p => !p.processed).length,
    withFaces: photos.filter(p => p.processed && p.faces && p.faces.length > 0).length,
    withErrors: photos.filter(p => p.processingError).length,
    totalFaces: photos.reduce((sum, p) => sum + (p.faces?.length || 0), 0),
  };

  successResponse(
    res,
    {
      photos: photos.map(p => ({
        id: p._id,
        filename: p.filename,
        url: p.url,
        uploadedAt: p.uploadedAt,
        processed: p.processed,
        faceCount: p.faces?.length || 0,
        matchCount: p.matches?.length || 0,
        processingError: p.processingError || null,
        size: p.size,
      })),
      stats,
    },
    'All photos retrieved successfully'
  );
});

/**
 * @desc Get single photo by ID
 * @route GET /api/photos/:id
 * @access Private or Public
 */
exports.getPhotoById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError('Invalid photo ID', 400);
  }

  const photo = await Photo.findById(id).select('-faces');
  if (!photo) {
    throw new AppError('Photo not found', 404);
  }

  const event = await Event.findById(photo.eventId);
  if (!event) {
    throw new AppError('Associated event not found', 404);
  }

  const eventOwnerId = event.userId || event.createdBy || event.organizer;

  if (req.user && eventOwnerId && eventOwnerId.toString() === req.user._id.toString()) {
    successResponse(res, photo, 'Photo retrieved successfully');
  } else {
    successResponse(
      res,
      {
        id: photo._id,
        filename: photo.filename,
        path: photo.path,
        uploadedAt: photo.uploadedAt,
      },
      'Photo retrieved successfully'
    );
  }
});

/**
 * @desc Delete photo
 * @route DELETE /api/photos/:id
 * @access Private
 */
exports.deletePhoto = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new AppError('Invalid photo ID', 400);
  }

  const photo = await Photo.findById(id);
  if (!photo) {
    throw new AppError('Photo not found', 404);
  }

  const event = await Event.findById(photo.eventId);
  if (!event) {
    throw new AppError('Associated event not found', 404);
  }

  const eventOwnerId = event.userId || event.createdBy || event.organizer;

  if (!eventOwnerId || eventOwnerId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to delete this photo', 403);
  }

  try {
    await fs.unlink(photo.path);
    logFile('delete', photo.filename, { photoId: photo._id });
  } catch (error) {
    logger.error('Failed to delete photo file', {
      photoId: photo._id,
      error: error.message,
    });
  }

  const photoSize = photo.size || 0;
  event.photosUploaded = Math.max(0, (event.photosUploaded || 0) - 1);
  event.storageUsed = Math.max(0, (event.storageUsed || 0) - photoSize);
  await event.save();

  if (req.user && typeof req.user.decrementStorageUsage === 'function') {
    await req.user.decrementStorageUsage(photoSize);
  } else if (req.user && req.user.quota) {
    req.user.quota.storageUsed = Math.max(0, (req.user.quota.storageUsed || 0) - photoSize);
    await req.user.save();
  }

  await photo.deleteOne();

  logger.info('Photo deleted', {
    userId: req.user._id,
    photoId: photo._id,
    eventId: event._id,
  });

  successResponse(res, null, 'Photo deleted successfully');
});

/**
 * @desc Manually trigger face processing
 * @route POST /api/photos/process/:photoId
 * @access Private
 */
exports.processPhotoFaces = asyncHandler(async (req, res, next) => {
  const { photoId } = req.params;

  if (!isValidObjectId(photoId)) {
    throw new AppError('Invalid photo ID', 400);
  }

  const photo = await Photo.findById(photoId);
  if (!photo) {
    throw new AppError('Photo not found', 404);
  }

  const event = await Event.findById(photo.eventId);
  const eventOwnerId = event?.userId || event?.createdBy || event?.organizer;

  if (!event || !eventOwnerId || eventOwnerId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to process this photo', 403);
  }

  try {
    const result = await faceRecognitionService.extractFaces(photo.path);

    if (result.success && result.facesDetected > 0) {
      const normalizedFaces = normalizeFaces(result.faces);
      photo.faces = normalizedFaces;
      photo.processed = true;
      photo.processingError = null;

      try {
        await photo.save();
      } catch (err) {
        logger.error('Face processing save failed', {
          photoId: photo._id,
          error: err.message,
        });
        photo.processed = true;
        photo.processingError = err.message;
        await photo.save().catch(() => {});
        throw new AppError('Face processing failed: ' + err.message, 500);
      }

      logAI('face-extraction', {
        photoId: photo._id,
        facesDetected: result.facesDetected,
      });

      await matchPhotoWithRegistrations(photo, photo.eventId);

      successResponse(
        res,
        {
          photoId: photo._id,
          facesDetected: result.facesDetected,
          processingTime: result.processingTime,
        },
        'Photo processed successfully'
      );
    } else {
      photo.processed = true;
      photo.processingError = 'No faces detected';
      await photo.save().catch(() => {});

      successResponse(
        res,
        {
          photoId: photo._id,
          facesDetected: 0,
          message: 'No faces detected in photo',
        },
        'Photo processed (no faces found)'
      );
    }
  } catch (error) {
    photo.processed = true;
    photo.processingError = error.message;
    await photo.save().catch(() => {});
    throw new AppError('Face processing failed: ' + error.message, 500);
  }
});

/**
 * @desc Get photo statistics for an event
 * @route GET /api/photos/event/:eventId/stats
 * @access Private
 */
exports.getPhotoStats = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  if (!isValidObjectId(eventId)) {
    throw new AppError('Invalid event ID', 400);
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  const eventOwnerId = event.userId || event.createdBy || event.organizer;

  if (!eventOwnerId || eventOwnerId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to view these statistics', 403);
  }

  const totalPhotos = await Photo.countDocuments({ eventId });
  const processedPhotos = await Photo.countDocuments({ eventId, processed: true });
  const photosWithFaces = await Photo.countDocuments({
    eventId,
    processed: true,
    'faces.0': { $exists: true },
  });

  const faceAggregation = await Photo.aggregate([
    { $match: { eventId: event._id, processed: true } },
    { $project: { faceCount: { $size: { $ifNull: ['$faces', []] } } } },
    { $group: { _id: null, totalFaces: { $sum: '$faceCount' } } },
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
    processingProgress: totalPhotos > 0 ? Math.round((processedPhotos / totalPhotos) * 100) : 0,
  };

  successResponse(res, stats, 'Photo statistics retrieved successfully');
});

/**
 * Face matching helper
 * Matches faces in a photo with registered users
 */
async function matchPhotoWithRegistrations(photo, eventId) {
  try {
    const config = require('../config/config');

    const registrations = await Registration.find({
      eventId,
      faceEmbedding: { $exists: true, $ne: null },
    });

    if (registrations.length === 0 || !photo.faces || photo.faces.length === 0) {
      return;
    }

    const matches = [];

    for (const registration of registrations) {
      for (const photoFace of photo.faces) {
        const similarity = calculateCosineSimilarity(
          registration.faceEmbedding,
          photoFace.embedding
        );

        const threshold = config.faceRecognition.matchThreshold;

        if (similarity >= threshold) {
          matches.push({
            registrationId: registration._id,
            email: registration.email,
            similarity,
          });

          logger.info('Face match found', {
            photoId: photo._id,
            registrationId: registration._id,
            email: registration.email,
            similarity: similarity.toFixed(3),
          });
        }
      }
    }

    if (matches.length > 0) {
      photo.matches = matches;
      await photo.save().catch((err) => {
        logger.error('Failed to save matches on photo', {
          photoId: photo._id,
          error: err.message,
        });
      });
    }
  } catch (error) {
    logger.error('Face matching failed', {
      photoId: photo._id,
      error: error.message,
    });
  }
}

/**
 * Cosine similarity calculation
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
    email: registration.email,
  });

  const regObjectId = new mongoose.Types.ObjectId(registrationId);

  const matchedPhotos = await Photo.find({
    eventId: registration.eventId,
    'matches.registrationId': regObjectId,
    processed: true,
  })
    .select('filename url path uploadedAt matches size')
    .sort('-uploadedAt');

  logger.info('Matched photos retrieved', {
    registrationId,
    count: matchedPhotos.length,
  });

  successResponse(
    res,
    {
      photos: matchedPhotos.map((p) => ({
        id: p._id,
        url: p.url,
        filename: p.filename,
        uploadedAt: p.uploadedAt,
        similarity: p.matches.find((m) => m.registrationId.toString() === registrationId)
          ?.similarity,
      })),
      count: matchedPhotos.length,
      guestName: registration.name,
      eventId: registration.eventId,
    },
    'Matched photos retrieved successfully'
  );
});

/**
 * @desc Trigger batch matching for all photos in an event
 * @route POST /api/photos/event/:eventId/batch-match
 * @access Private
 */
exports.triggerBatchMatching = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;

  const photos = await Photo.find({
    eventId,
    processed: true,
    'faces.0': { $exists: true },
  });

  let matched = 0;

  for (const photo of photos) {
    await matchPhotoWithRegistrations(photo, eventId);
    if (photo.matches && photo.matches.length > 0) matched++;
  }

  successResponse(
    res,
    {
      totalPhotos: photos.length,
      photosWithMatches: matched,
    },
    'Batch matching completed'
  );
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

  const registration = await Registration.findById(registrationId);
  if (!registration) {
    throw new AppError('Registration not found', 404);
  }

  if (!registration.faceEmbedding) {
    throw new AppError('No face data found for this registration', 400);
  }

  const photos = await Photo.find({
    eventId: registration.eventId,
    processed: true,
    'faces.0': { $exists: true },
  }).select('_id faces url filename uploadedAt');

  if (photos.length === 0) {
    return successResponse(
      res,
      {
        photos: [],
        count: 0,
        message: 'No photos available yet',
      },
      'No photos found'
    );
  }

  const photoData = photos.map((p) => ({
    id: p._id.toString(),
    faces: p.faces,
  }));

  logger.info('Starting face matching', {
    registrationId,
    totalPhotos: photos.length,
    totalFaces: photoData.reduce((sum, p) => sum + p.faces.length, 0),
  });

  const result = await faceRecognitionService.findMatchingPhotos(
    registration.faceEmbedding,
    photoData
  );

  if (!result.success) {
    throw new AppError('Face matching failed: ' + result.error, 500);
  }

  const matchedPhotoIds = [...new Set(result.matched_photos.map((m) => m.photo_id))];

  const matchedPhotos = await Photo.find({
    _id: { $in: matchedPhotoIds },
  }).select('_id url filename uploadedAt size');

  logger.info('Matching complete', {
    registrationId,
    matchedPhotos: matchedPhotos.length,
    totalMatches: result.total_matches,
  });

  successResponse(
    res,
    {
      photos: matchedPhotos.map((p) => ({
        id: p._id,
        url: p.url,
        filename: p.filename,
        uploadedAt: p.uploadedAt,
        matches: result.matched_photos.filter((m) => m.photo_id === p._id.toString()),
      })),
      count: matchedPhotos.length,
      totalMatches: result.total_matches,
      guestName: registration.name,
    },
    'Matched photos retrieved successfully'
  );
});
