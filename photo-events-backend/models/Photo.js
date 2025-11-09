const mongoose = require('mongoose');

const FaceSchema = new mongoose.Schema({
  faceIndex: {
    type: Number,
    required: true
  },
  embedding: {
    type: [Number],  // Array of 512 numbers
    required: true
  },
  boundingBox: {
    type: [Number],  // [x, y, width, height]
    required: true
  },
  age: {
    type: Number
  },
  gender: {
    type: String,
    enum: ['M', 'F']
  },
  confidence: {
    type: Number  // Detection confidence 0-1
  }
}, { _id: false });

const PhotoSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  
  // NEW: Face recognition fields
  faces: [FaceSchema],  // Array of detected faces with embeddings
  processed: {
    type: Boolean,
    default: false
  },
  processingError: {
    type: String,
    default: null
  },
  
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Photo', PhotoSchema);
