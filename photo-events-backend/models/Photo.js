// backend/models/Photo.js
const mongoose = require('mongoose');

const FaceSchema = new mongoose.Schema(
  {
    faceIndex: {
      type: Number,
      required: true
    },
    embedding: {
      type: [Number], // Array of embedding values
      required: true
    },
    boundingBox: {
      type: [Number], // [x, y, width, height]
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
      type: Number // Detection confidence 0–1
    }
  },
  { _id: false }
);

const MatchSchema = new mongoose.Schema(
  {
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,  // ✅ MUST BE ObjectId
      ref: 'Registration'
    },
    email: { type: String },
    similarity: { type: Number }
  },
  { _id: false }
);

const PhotoSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    url: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },

    faces: [FaceSchema],
    processed: {
      type: Boolean,
      default: false
    },
    processingError: {
      type: String,
      default: null
    },

    matches: [MatchSchema],

    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
PhotoSchema.index({ eventId: 1, uploadedAt: -1 });
PhotoSchema.index({ userId: 1 });
PhotoSchema.index({ processed: 1 });
PhotoSchema.index({ 'matches.registrationId': 1 });



PhotoSchema.index({ eventId: 1, processed: 1 }); // Filter by event and processed status
PhotoSchema.index({ 'matches.registrationId': 1 }); // ← ADD THIS for fast guest photo lookup
PhotoSchema.index({ eventId: 1, uploadedAt: -1 }); // Sort by upload date

module.exports = mongoose.model('Photo', PhotoSchema);