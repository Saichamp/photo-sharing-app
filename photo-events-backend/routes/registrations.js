/**
 * Registration Routes for PhotoManEa
 * Handles guest registration for events
 */

const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { registrationLimiter } = require('../middleware/rateLimiter');
const { validateBody } = require('../utils/validators');
const { uploadSelfie, handleMulterError } = require('../middleware/upload'); // ✅ FIXED: Destructured import

/**
 * @route   POST /api/registrations/register
 * @desc    Register guest for an event (NEW - FRONTEND COMPATIBLE)
 * @access  Public
 * @rateLimit 20 registrations per hour per IP
 */
router.post(
  '/register',
  registrationLimiter,
  uploadSelfie.single('selfie'), // ✅ FIXED: Use uploadSelfie
  handleMulterError, // ✅ ADDED: Handle multer errors
  validateBody('registration'),
  registrationController.registerGuest
);

/**
 * @route   POST /api/registrations
 * @desc    Register guest for an event (LEGACY - BACKWARD COMPATIBLE)
 * @access  Public
 * @rateLimit 20 registrations per hour per IP
 */
router.post(
  '/',
  registrationLimiter,
  uploadSelfie.single('selfie'), // ✅ FIXED: Use uploadSelfie
  handleMulterError, // ✅ ADDED: Handle multer errors
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

/**
 * @route   PUT /api/registrations/:id
 * @desc    Update registration details
 * @access  Public (with email verification in future)
 */
router.put(
  '/:id',
  registrationController.updateRegistration
);

/**
 * @route   DELETE /api/registrations/:id
 * @desc    Delete a registration
 * @access  Public (with email verification in future)
 */
router.delete(
  '/:id',
  registrationController.deleteRegistration
);

module.exports = router;
