/**
 * Registration Controller for PhotoManEa
 * Handles guest registration for events
 */

const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { AppError, asyncHandler, successResponse } = require('../middleware/errorHandler');
const { logDatabase, logFile, logger } = require('../utils/logger');
const faceRecognitionService = require('../services/faceRecognition/faceRecognitionWrapper');
const { isValidObjectId } = require('../utils/validators');
const path = require('path');

// ============================================
// ✅ HELPER FUNCTIONS FOR FACE MATCHING
// ============================================

/**
 * Calculate cosine similarity between two embeddings
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
 * Match a registration against all event photos
 */
async function matchRegistrationWithPhotos(registration) {
  try {
    const Photo = require('../models/Photo');
    const config = require('../config/config');
    
    // Get all processed photos with faces for this event
    const photos = await Photo.find({
      eventId: registration.eventId,
      processed: true,
      'faces.0': { $exists: true }
    });

    if (photos.length === 0 || !registration.faceEmbedding) {
      logger.info('No photos to match', { 
        registrationId: registration._id,
        photosFound: photos.length,
        hasFaceData: !!registration.faceEmbedding
      });
      return;
    }

    let totalMatches = 0;

    // Match against each photo
    for (const photo of photos) {
      const matches = [];
      
      for (const photoFace of photo.faces) {
        const similarity = calculateCosineSimilarity(
          registration.faceEmbedding,
          photoFace.embedding
        );
        
        const threshold = config.faceRecognition?.matchThreshold || 0.6;
        
        if (similarity >= threshold) {
          matches.push({
            registrationId: registration._id,
            email: registration.email,
            similarity
          });
          totalMatches++;
        }
      }
      
      if (matches.length > 0) {
        photo.matches = photo.matches || [];
        photo.matches.push(...matches);
        await photo.save();
        
        logger.info('Match found', {
          photoId: photo._id,
          registrationId: registration._id,
          matchCount: matches.length
        });
      }
    }

    logger.info('Registration matching complete', {
      registrationId: registration._id,
      totalPhotos: photos.length,
      totalMatches
    });

  } catch (error) {
    logger.error('Face matching failed after registration', {
      registrationId: registration._id,
      error: error.message
    });
  }
}

// ============================================
// ✅ CONTROLLER METHODS
// ============================================

/**
 * @desc Register guest for an event
 * @route POST /api/registrations/register
 * @access Public
 */
exports.registerGuest = asyncHandler(async (req, res, next) => {
  const { eventId, name, email, phone } = req.body;

  // Validate required fields
  if (!eventId || !name || !email || !phone) {
    throw new AppError('Event ID, name, email, and phone are required', 400);
  }

  // Validate eventId is a valid MongoDB ObjectId
  if (!isValidObjectId(eventId)) {
    throw new AppError('Invalid event reference. Please use a valid event link.', 400);
  }

  // Verify event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found or may have been deleted', 404);
  }

  // Check if already registered
  const existingRegistration = await Registration.findOne({ eventId, email });
  if (existingRegistration) {
    throw new AppError('Email already registered for this event', 409);
  }

  // Process selfie if provided
  let faceEmbedding = null;
  let selfiePath = null;

  if (req.file) {
    selfiePath = req.file.path;

    try {
      // Use InsightFace-based selfie extractor (buffalo_l)
      const result = await faceRecognitionService.extractFaceFromSelfie(selfiePath);

      if (result.success && result.embedding) {
        faceEmbedding = result.embedding;

        logFile('selfie-upload', req.file.filename, {
          registrationEmail: email,
          eventId,
        });
      } else {
        const fs = require('fs').promises;
        await fs.unlink(selfiePath).catch(() => {});
        throw new AppError(
          'Face detection failed: ' +
            (result.error || 'No face detected in selfie. Please upload a clear photo.'),
          400
        );
      }
    } catch (error) {
      const fs = require('fs').promises;
      await fs.unlink(selfiePath).catch(() => {});
      throw new AppError('Face detection failed: ' + error.message, 500);
    }
  }

  // Create registration
  const registration = await Registration.create({
    eventId,
    name,
    email,
    phone,
    faceEmbedding,
    selfiePath,
  });

  // Increment event registration count
  await event.incrementRegistration();

  // ✅ NEW: Match against existing event photos
  if (faceEmbedding) {
    // Run matching in background (don't wait for it)
    matchRegistrationWithPhotos(registration).catch(err => {
      logger.error('Background face matching failed', {
        registrationId: registration._id,
        error: err.message
      });
    });
    
    logger.info('Triggered face matching for new registration', {
      registrationId: registration._id,
      eventId
    });
  }

  logDatabase('CREATE', 'registrations', {
    registrationId: registration._id,
    eventId,
    email,
  });

  logger.info('Guest registered', {
    registrationId: registration._id,
    eventId,
    email,
    hasFaceData: !!faceEmbedding,
  });

  successResponse(
    res,
    {
      id: registration._id,
      name: registration.name,
      email: registration.email,
      eventName: event.name,
      eventDate: event.date,
      qrCode: event.qrCode,
      hasFaceRecognition: !!faceEmbedding,
    },
    'Registration successful',
    201
  );
});

/**
 * @desc Get all registrations for an event
 * @route GET /api/registrations/event/:eventId
 * @access Public (will be protected in Phase 3)
 */
exports.getEventRegistrations = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Validate eventId is a valid MongoDB ObjectId
  if (!isValidObjectId(eventId)) {
    throw new AppError('Invalid event reference', 400);
  }

  // Verify event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Get registrations
  const skip = (page - 1) * limit;
  const registrations = await Registration.find({ eventId })
    .select('-faceEmbedding') // Don't send face embeddings
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Registration.countDocuments({ eventId });

  successResponse(
    res,
    {
      registrations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    },
    'Registrations retrieved successfully'
  );
});

/**
 * @desc Get single registration by ID
 * @route GET /api/registrations/:id
 * @access Public
 */
exports.getRegistrationById = asyncHandler(async (req, res, next) => {
  // Validate registration ID
  if (!isValidObjectId(req.params.id)) {
    throw new AppError('Invalid registration ID', 400);
  }

  const registration = await Registration.findById(req.params.id).select('-faceEmbedding');
  if (!registration) {
    throw new AppError('Registration not found', 404);
  }

  // Get event details
  const event = await Event.findById(registration.eventId);

  successResponse(
    res,
    {
      registration,
      event: {
        id: event._id,
        name: event.name,
        date: event.date,
        location: event.location,
      },
    },
    'Registration retrieved successfully'
  );
});

/**
 * @desc Update registration
 * @route PUT /api/registrations/:id
 * @access Public (with email verification in future)
 */
exports.updateRegistration = asyncHandler(async (req, res, next) => {
  const { name, phone } = req.body;

  // Validate registration ID
  if (!isValidObjectId(req.params.id)) {
    throw new AppError('Invalid registration ID', 400);
  }

  const registration = await Registration.findById(req.params.id);
  if (!registration) {
    throw new AppError('Registration not found', 404);
  }

  // Update allowed fields
  if (name) registration.name = name;
  if (phone) registration.phone = phone;

  await registration.save();

  logger.info('Registration updated', {
    registrationId: registration._id,
    updatedFields: Object.keys(req.body),
  });

  successResponse(res, registration, 'Registration updated successfully');
});

/**
 * @desc Delete registration
 * @route DELETE /api/registrations/:id
 * @access Public (with email verification in future)
 */
exports.deleteRegistration = asyncHandler(async (req, res, next) => {
  // Validate registration ID
  if (!isValidObjectId(req.params.id)) {
    throw new AppError('Invalid registration ID', 400);
  }

  const registration = await Registration.findById(req.params.id);
  if (!registration) {
    throw new AppError('Registration not found', 404);
  }

  const eventId = registration.eventId;

  // Delete selfie file if exists
  if (registration.selfiePath) {
    const fs = require('fs').promises;
    await fs.unlink(registration.selfiePath).catch(() => {});
  }

  await registration.deleteOne();

  // Decrement event registration count
  const event = await Event.findById(eventId);
  if (event) {
    event.registrationCount = Math.max(0, event.registrationCount - 1);
    await event.save();
  }

  logger.info('Registration deleted', {
    registrationId: registration._id,
    eventId,
  });

  successResponse(res, null, 'Registration deleted successfully');
});
