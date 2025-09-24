const Registration = require('../models/Registration');
const Event = require('../models/Event');

// Create new registration (from React frontend)
const createRegistration = async (req, res) => {
  try {
    const { eventId, name, email, phone, faceImageUrl } = req.body;

    console.log('📝 Registration attempt:', { eventId, name, email });

    // Find event by QR code (eventId is actually the QR code)
    const event = await Event.findOne({ qrCode: eventId });
    if (!event) {
      console.log('❌ Event not found with QR code:', eventId);
      return res.status(404).json({ error: 'Event not found' });
    }

    console.log('✅ Event found:', event.name);

    // Check if already registered (use event._id for consistency)
    const existingReg = await Registration.findOne({ 
      eventId: eventId,  // Keep QR code as eventId for now
      email: email 
    });
    
    if (existingReg) {
      console.log('❌ Already registered:', email);
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    // Create registration
    const registration = new Registration({
      eventId: eventId,  // This will be the QR code
      name,
      email,
      phone,
      faceImageUrl
    });

    await registration.save();
    console.log('✅ Registration saved:', registration._id);

    // Update event registration count
    await Event.findByIdAndUpdate(event._id, {
      $inc: { registrationCount: 1 }
    });

    console.log('✅ Event registration count updated');

    res.status(201).json({
      message: 'Registration successful!',
      registrationId: registration._id,
      eventName: event.name
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Get registrations for an event
const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log('📋 Getting registrations for eventId:', eventId);
    
    const registrations = await Registration.find({ eventId })
      .select('name email phone registeredAt status')
      .sort({ registeredAt: -1 });

    console.log('✅ Found registrations:', registrations.length);

    res.json(registrations);
  } catch (error) {
    console.error('❌ Get registrations error:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
};

module.exports = {
  createRegistration,
  getEventRegistrations
};
