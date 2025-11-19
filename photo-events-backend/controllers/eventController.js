/**
 * Event Controller for PhotoManEa
 * Handles event CRUD operations with user-based filtering
 */

const Event = require('../models/Event');
const User = require('../models/User');
const { AppError, asyncHandler, successResponse } = require('../middleware/errorHandler');
const { logDatabase, logger } = require('../utils/logger');
const { generateQRCode } = require('../utils/helpers');

/**
 * @desc    Create new event
 * @route   POST /api/events
 * @access  Private
 */
exports.createEvent = asyncHandler(async (req, res, next) => {
  const { name, date, description, location, expectedGuests } = req.body;
  
  // Generate unique QR code
  const qrCode = generateQRCode(name);
  
  // Create event with userId
  const event = await Event.create({
    userId: req.user._id,
    name,
    date,
    description,
    location,
    expectedGuests,
    qrCode,
    organizerEmail: req.user.email
  });
  
  // Increment user's event usage
  await req.user.incrementEventUsage();
  
  logDatabase('CREATE', 'events', {
    eventId: event._id,
    userId: req.user._id,
    eventName: name
  });
  
  logger.info('Event created', {
    eventId: event._id,
    userId: req.user._id,
    eventName: name
  });
  
  successResponse(res, {
    id: event._id,
    name: event.name,
    date: event.date,
    qrCode: event.qrCode,
    status: event.status,
    expectedGuests: event.expectedGuests
  }, 'Event created successfully', 201);
});

/**
 * @desc    Get all events for logged-in user
 * @route   GET /api/events
 * @access  Private
 */
exports.getEvents = asyncHandler(async (req, res, next) => {
  const { status, sort = '-createdAt', page = 1, limit = 20 } = req.query;
  
  // Build query - only user's events
  const query = { userId: req.user._id };
  
  if (status) {
    query.status = status;
  }
  
  // Pagination
  const skip = (page - 1) * limit;
  
  // Get events
  const events = await Event.find(query)
    .sort(sort)
    .limit(parseInt(limit))
    .skip(skip);
  
  // Get total count
  const total = await Event.countDocuments(query);
  
  logDatabase('READ', 'events', {
    userId: req.user._id,
    count: events.length
  });
  
  successResponse(res, {
    events,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  }, 'Events retrieved successfully');
});

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Private
 */
exports.getEventById = asyncHandler(async (req, res, next) => {
  // Event already loaded by verifyOwnership middleware
  const event = req.resource;
  
  logDatabase('READ', 'events', {
    eventId: event._id,
    userId: req.user._id
  });
  
  successResponse(res, event, 'Event retrieved successfully');
});

/**
 * @desc    Update event
 * @route   PUT /api/events/:id
 * @access  Private
 */
exports.updateEvent = asyncHandler(async (req, res, next) => {
  const { name, date, description, location, expectedGuests, settings } = req.body;
  
  // Event already loaded by verifyOwnership middleware
  const event = req.resource;
  
  // Update fields
  if (name) event.name = name;
  if (date) event.date = date;
  if (description !== undefined) event.description = description;
  if (location) event.location = location;
  if (expectedGuests) event.expectedGuests = expectedGuests;
  if (settings) event.settings = { ...event.settings, ...settings };
  
  await event.save();
  
  logDatabase('UPDATE', 'events', {
    eventId: event._id,
    userId: req.user._id,
    updatedFields: Object.keys(req.body)
  });
  
  logger.info('Event updated', {
    eventId: event._id,
    userId: req.user._id
  });
  
  successResponse(res, event, 'Event updated successfully');
});

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private
 */
exports.deleteEvent = asyncHandler(async (req, res, next) => {
  // Event already loaded by verifyOwnership middleware
  const event = req.resource;
  
  await event.deleteOne();
  
  // Decrement user's event usage
  req.user.quota.eventsUsed = Math.max(0, req.user.quota.eventsUsed - 1);
  await req.user.save();
  
  logDatabase('DELETE', 'events', {
    eventId: event._id,
    userId: req.user._id
  });
  
  logger.warn('Event deleted', {
    eventId: event._id,
    userId: req.user._id,
    eventName: event.name
  });
  
  successResponse(res, null, 'Event deleted successfully');
});

/**
 * @desc    Get event statistics
 * @route   GET /api/events/:id/stats
 * @access  Private
 */
exports.getEventStats = asyncHandler(async (req, res, next) => {
  const event = req.resource;
  
  // You can add more stats here later
  const stats = {
    eventId: event._id,
    eventName: event.name,
    status: event.status,
    registrations: event.registrationCount,
    expectedGuests: event.expectedGuests,
    registrationProgress: Math.round((event.registrationCount / event.expectedGuests) * 100),
    photosUploaded: event.photosUploaded,
    storageUsed: event.storageUsedMB + ' MB',
    createdAt: event.createdAt,
    isPast: event.isPast
  };
  
  successResponse(res, stats, 'Event statistics retrieved successfully');
});

/**
 * @desc    Get event by QR code (for guest registration)
 * @route   GET /api/events/qr/:qrCode
 * @access  Public
 */
exports.getEventByQRCode = asyncHandler(async (req, res, next) => {
  const { qrCode } = req.params;
  
  const event = await Event.findOne({ qrCode });
  
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  
  // Return limited info for public access
  successResponse(res, {
    id: event._id,
    name: event.name,
    date: event.date,
    location: event.location,
    organizerEmail: event.organizerEmail,
    qrCode: event.qrCode
  }, 'Event retrieved successfully');
});
