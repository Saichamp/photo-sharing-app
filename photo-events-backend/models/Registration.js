const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  // Face recognition fields
  selfieUrl: {
    type: String,
    default: null
  },
  faceEmbedding: {
    type: [Number], // Array of 512 numbers
    default: null
  },
  faceProcessed: {
    type: Boolean,
    default: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ✅ FIXED: Compound unique index prevents duplicate email per event
RegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });

// Index for performance
RegistrationSchema.index({ registeredAt: -1 });

module.exports = mongoose.model('Registration', RegistrationSchema);