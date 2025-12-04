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

/**
 * @desc Register guest for an event
 * @route POST /api/registrations
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
