const express = require('express');
const router = express.Router();
const { createEvent, getAllEvents, getEvent } = require('../controllers/eventController');

// POST /api/events - Create new event
router.post('/', createEvent);

// GET /api/events - Get all events
router.get('/', getAllEvents);

// GET /api/events/:qrCode - Get single event
router.get('/:qrCode', getEvent);

module.exports = router;
