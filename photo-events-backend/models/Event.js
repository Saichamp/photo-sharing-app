const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  expectedGuests: {
    type: Number,
    required: true,
    min: 1
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },
  registrationCount: {
    type: Number,
    default: 0
  },
  photosUploaded: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  organizerEmail: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Event', eventSchema);
