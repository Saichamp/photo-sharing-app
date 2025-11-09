const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  
  // NEW: Face recognition fields
  selfieUrl: {
    type: String,
    default: null
  },
  faceEmbedding: {
    type: [Number],  // Array of 512 numbers
    default: null
  },
  faceProcessed: {
    type: Boolean,
    default: false
  },
  
  // Existing QR code fields
  qrCode: {
    type: String,
    unique: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Registration', RegistrationSchema);
