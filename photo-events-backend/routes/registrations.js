/**
 * Registration Routes for PhotoManEa
 * Handles guest registration for events
 */

const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { registrationLimiter } = require('../middleware/rateLimiter');
const { validateBody } = require('../utils/validators');
const upload = require('../middleware/upload');

/**
 * @route   POST /api/registrations
 * @desc    Register guest for an event
 * @access  Public
 * @rateLimit 20 registrations per hour per IP
 */
router.post(
  '/',
  registrationLimiter,
  upload.single('selfie'),
  validateBody('registration'),
  registrationController.registerGuest
);

/**
 * @route   GET /api/registrations/event/:eventId
 * @desc    Get all registrations for an event
 * @access  Public (for now - will be protected in Phase 3)
 */
router.get(
  '/event/:eventId',
  registrationController.getEventRegistrations
);

/**
 * @route   GET /api/registrations/:id
 * @desc    Get single registration by ID
 * @access  Public
 */
router.get(
  '/:id',
  registrationController.getRegistrationById
);

module.exports = router;
