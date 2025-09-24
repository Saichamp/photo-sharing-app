const express = require('express');
const router = express.Router();
const { createRegistration, getEventRegistrations } = require('../controllers/registrationController');

// POST /api/registrations - Create new registration
router.post('/', createRegistration);

// GET /api/registrations/:eventId - Get event registrations
router.get('/:eventId', getEventRegistrations);

module.exports = router;
