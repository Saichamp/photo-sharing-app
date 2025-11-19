/**
 * Event Routes for PhotoManEa
 * Handles event creation, retrieval, and management
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, checkQuota, verifyOwnership } = require('../middleware/authenticate');
const { createEventLimiter } = require('../middleware/rateLimiter');
const { validateBody, validateObjectIdParam } = require('../utils/validators');
const Event = require('../models/Event');

/**
 * @route   POST /api/events
 * @desc    Create new event
 * @access  Private (Requires authentication)
 * @rateLimit 10 events per hour
 */
router.post(
  '/',
  authenticate,
  checkQuota('events'),
  createEventLimiter,
  validateBody('event'),
  eventController.createEvent
);

/**
 * @route   GET /api/events
 * @desc    Get all events for logged-in user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  eventController.getEvents
);

/**
 * @route   GET /api/events/:id
 * @desc    Get single event by ID
 * @access  Private (must own the event)
 */
router.get(
  '/:id',
  authenticate,
  validateObjectIdParam('id'),
  verifyOwnership(Event, 'userId'),
  eventController.getEventById
);

/**
 * @route   PUT /api/events/:id
 * @desc    Update event
 * @access  Private (must own the event)
 */
router.put(
  '/:id',
  authenticate,
  validateObjectIdParam('id'),
  verifyOwnership(Event, 'userId'),
  eventController.updateEvent
);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Private (must own the event)
 */
router.delete(
  '/:id',
  authenticate,
  validateObjectIdParam('id'),
  verifyOwnership(Event, 'userId'),
  eventController.deleteEvent
);

/**
 * @route   GET /api/events/:id/stats
 * @desc    Get event statistics
 * @access  Private (must own the event)
 */
router.get(
  '/:id/stats',
  authenticate,
  validateObjectIdParam('id'),
  verifyOwnership(Event, 'userId'),
  eventController.getEventStats
);

/**
 * @route   GET /api/events/:qrCode/public
 * @desc    Get event by QR code (for guest registration)
 * @access  Public
 */
router.get(
  '/qr/:qrCode',
  eventController.getEventByQRCode
);

module.exports = router;
