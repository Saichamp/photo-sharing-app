const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  // NEW: Enhanced face detection storage
  faces: [{
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    embedding: [Number], // 512-dimensional face recognition vector
    confidence: Number,
    // NEW: Quality assessment for blurry image handling
    quality: {
      sharpness: Number,
      brightness: Number,
      isBlurry: Boolean
    }
  }],
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'matched'],
    default: 'uploaded'
  }
});

photoSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.model('Photo', photoSchema);
