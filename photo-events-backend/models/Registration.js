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
  // NEW: Face embedding for AI recognition
  faceEmbedding: {
    type: [Number], // 512-dimensional ArcFace embedding
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
  // NEW: Store matched photos with confidence scores
  photosMatched: [{
    photoId: String,
    matchConfidence: Number,
    matchedAt: Date
  }]
});

// Index for faster queries
registrationSchema.index({ eventId: 1, email: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
