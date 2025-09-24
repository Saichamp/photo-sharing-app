const Registration = require('../models/Registration');
const Event = require('../models/Event');

// Create new registration (from React frontend)
const createRegistration = async (req, res) => {
  try {
    const { eventId, name, email, phone, faceImageUrl } = req.body;

    // Check if event exists
    const event = await Event.findOne({ qrCode: eventId });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if already registered
    const existingReg = await Registration.findOne({ eventId, email });
    if (existingReg) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    // Create registration
    const registration = new Registration({
      eventId,
      name,
      email,
      phone,
      faceImageUrl
    });

    await registration.save();

    // Update event registration count
    await Event.findByIdAndUpdate(event._id, {
      $inc: { registrationCount: 1 }
    });

    res.status(201).json({
      message: 'Registration successful!',
      registrationId: registration._id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Get registrations for an event
const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const registrations = await Registration.find({ eventId })
      .select('name email phone registeredAt status')
      .sort({ registeredAt: -1 });

    res.json(registrations);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
};

module.exports = {
  createRegistration,
  getEventRegistrations
};
