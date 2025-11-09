const Event = require('../models/Event');

// Create new event
const createEvent = async (req, res) => {
  try {
    const { name, date, description, expectedGuests, organizerEmail, location } = req.body;
    
    console.log('🎉 Creating new event:', { name, date, organizerEmail });

    // Generate unique QR code
    const qrCode = `event-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Create event
    const event = new Event({
      name,
      date,
      description,
      location: location || 'Not specified',
      expectedGuests,
      qrCode,
      organizerEmail,
      status: new Date(date) > new Date() ? 'upcoming' : 'active'
    });

    await event.save();

    console.log('✅ Event saved to database:', event._id);
    console.log('📋 QR Code generated:', qrCode);

    res.status(201).json({
      success: true,
      message: 'Event created successfully!',
      data: {
        _id: event._id,
        name: event.name,
        date: event.date,
        location: event.location,
        qrCode: event.qrCode,
        registrationUrl: `${req.protocol}://${req.get('host')}/register/${event.qrCode}`
      }
    });

  } catch (error) {
    console.error('❌ Create event error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create event',
      message: error.message 
    });
  }
}; // <-- FIXED: Added closing brace

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .select('name date location status registrationCount photosUploaded qrCode createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events
    });

  } catch (error) {
    console.error('❌ Get events error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch events' 
    });
  }
};

// Get single event
const getEvent = async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    const event = await Event.findOne({ qrCode });

    if (!event) {
      return res.status(404).json({ 
        success: false,
        error: 'Event not found' 
      });
    }

    res.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('❌ Get event error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch event' 
    });
  }
};

// Get event by ID
const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ 
        success: false,
        error: 'Event not found' 
      });
    }

    res.json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('❌ Get event by ID error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch event' 
    });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEvent,
  getEventById
};
