const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: String,
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
    required: true,
    trim: true
  },
  faceImageUrl: {
    type: String,
    required: true
  },
  faceEmbedding: {
    type: [Number], // Array of numbers for face recognition
    default: []
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'processed', 'photos_sent'],
    default: 'active'
  },
  photosMatched: [{
    photoId: String,
    matchConfidence: Number,
    matchedAt: Date
  }]
});

// Index for faster queries
registrationSchema.index({ eventId: 1, email: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
