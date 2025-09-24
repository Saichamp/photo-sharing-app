const Event = require('../models/Event');

// Create new event
const createEvent = async (req, res) => {
  try {
    const { name, date, description, expectedGuests, organizerEmail } = req.body;
    
    console.log('🎉 Creating new event:', { name, date, organizerEmail });

    const qrCode = `event-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    const event = new Event({
      name,
      date,
      description,
      expectedGuests,
      qrCode,
      organizerEmail,
      status: new Date(date) > new Date() ? 'upcoming' : 'active'
    });

    await event.save();
    
    console.log('✅ Event saved to database:', event._id);
    console.log('📋 QR Code generated:', qrCode);

    res.status(201).json({
      message: 'Event created successfully!',
      event: {
        id: event._id,
        name: event.name,
        date: event.date,
        qrCode: event.qrCode,
        registrationUrl: `${req.protocol}://${req.get('host')}/register/${event.qrCode}`
      }
    });

  } catch (error) {
    console.error('❌ Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .select('name date status registrationCount photosUploaded qrCode')
      .sort({ createdAt: -1 });

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Get single event
const getEvent = async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    const event = await Event.findOne({ qrCode });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};



module.exports = {
  createEvent,
  getAllEvents,
  getEvent
};
