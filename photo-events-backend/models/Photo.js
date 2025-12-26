/**
 * Photo Model
 * Stores uploaded photos with face detection data
 */

const mongoose = require('mongoose');

// Sub-schema for detected faces
const FaceSchema = new mongoose.Schema({
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
    type: Number // Detection confidence (0-1)
  }
}, { _id: false });

// Sub-schema for matches
const MatchSchema = new mongoose.Schema({
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  },
  email: {
    type: String
  },
  similarity: {
    type: Number
  }
}, { _id: false });

// Main Photo Schema
const PhotoSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
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
}, { timestamps: true });

// ✅ Indexes (declare once only!)
PhotoSchema.index({ eventId: 1, uploadedAt: -1 }); // Sort by upload date
PhotoSchema.index({ userId: 1 }); // Query by user
PhotoSchema.index({ processed: 1 }); // Filter by processing status
PhotoSchema.index({ 'matches.registrationId': 1 }); // Fast guest photo lookup
PhotoSchema.index({ eventId: 1, processed: 1 }); // Filter by event and processed status

module.exports = mongoose.model('Photo', PhotoSchema);
