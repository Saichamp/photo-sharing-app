const Registration = require('../models/Registration');
const Event = require('../models/Event');
const QRCode = require('qrcode');
const path = require('path');
const faceService = require('../services/faceRecognitionService');

// Generate unique QR code
const generateQRCode = async (eventId, registrationId) => {
  const qrData = JSON.stringify({
    eventId: eventId,
    registrationId: registrationId,
    timestamp: new Date().toISOString()
  });
  
  return await QRCode.toDataURL(qrData);
};

// POST - Register for an event
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId, name, email, phone } = req.body;
    const selfieFile = req.file; // Uploaded selfie (if using multer)

    // Validate required fields
    if (!eventId || !name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check for duplicate registration
    const existingRegistration = await Registration.findOne({
      eventId,
      email
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    // Create registration object
    const registrationData = {
      eventId,
      name,
      email,
      phone
    };

    // FACE RECOGNITION: Extract embedding if selfie provided
    if (selfieFile) {
      try {
        console.log('📸 Processing selfie for face recognition...');
        
        const selfiePath = selfieFile.path;
        registrationData.selfieUrl = `/uploads/faces/${selfieFile.filename}`;

        // Extract face embedding
        const faceResult = await faceService.extractFaces(selfiePath);

        if (faceResult.facesDetected === 0) {
          // No face detected - still allow registration but warn
          console.warn('⚠️  No face detected in selfie');
          registrationData.faceProcessed = false;
        } else if (faceResult.facesDetected > 1) {
          // Multiple faces - use first one but warn
          console.warn(`⚠️  Multiple faces detected (${faceResult.facesDetected}), using first one`);
          registrationData.faceEmbedding = faceResult.faces[0].embedding;
          registrationData.faceProcessed = true;
        } else {
          // Perfect - single face detected
          console.log('✅ Face detected successfully');
          registrationData.faceEmbedding = faceResult.faces[0].embedding;
          registrationData.faceProcessed = true;
        }

        console.log(`⏱️  Face processing took ${faceResult.processingTime}s`);
      } catch (faceError) {
        // Face recognition failed - still allow registration
        console.error('❌ Face recognition error:', faceError.message);
        registrationData.faceProcessed = false;
      }
    }

    // Create registration
    const registration = new Registration(registrationData);
    await registration.save();

    // Generate QR code
    const qrCode = await generateQRCode(eventId, registration._id);
    registration.qrCode = qrCode;
    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        registrationId: registration._id,
        name: registration.name,
        email: registration.email,
        qrCode: registration.qrCode,
        faceProcessed: registration.faceProcessed || false,
        selfieUrl: registration.selfieUrl
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// GET - Get all registrations for an event
exports.getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await Registration.find({ eventId })
      .select('-faceEmbedding') // Don't send embeddings to frontend
      .sort({ registeredAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    });

  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: error.message
    });
  }
};

// GET - Get single registration by ID
exports.getRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findById(registrationId)
      .select('-faceEmbedding'); // Don't send embedding to frontend

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: registration
    });

  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration',
      error: error.message
    });
  }
};

// DELETE - Delete registration
exports.deleteRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await Registration.findByIdAndDelete(registrationId);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      message: 'Registration deleted successfully'
    });

  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete registration',
      error: error.message
    });
  }
};
