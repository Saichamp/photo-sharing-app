const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [100, 'Event name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  // ADD THIS FIELD
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event organizer is required']
  },
  qrCode: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'draft'],
    default: 'active'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  maxGuests: {
    type: Number,
    default: null
  },
  // ✅ ADD THESE FIELDS TO TRACK COUNTS
  registrationCount: {
    type: Number,
    default: 0
  },
  photosUploaded: {
    type: Number,
    default: 0
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  settings: {
    allowGuestRegistration: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    autoEmailPhotos: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate unique QR code before saving
eventSchema.pre('save', function(next) {
  if (!this.qrCode) {
    this.qrCode = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// ✅ ADD THESE INSTANCE METHODS
eventSchema.methods.incrementRegistration = async function() {
  this.registrationCount = (this.registrationCount || 0) + 1;
  await this.save();
};

eventSchema.methods.decrementRegistration = async function() {
  this.registrationCount = Math.max(0, (this.registrationCount || 0) - 1);
  await this.save();
};

eventSchema.methods.incrementPhotoStats = async function(sizeInBytes, count = 1) {
  this.photosUploaded = (this.photosUploaded || 0) + count;
  this.storageUsed = (this.storageUsed || 0) + sizeInBytes;
  await this.save();
};

eventSchema.methods.decrementPhotoStats = async function(sizeInBytes) {
  this.photosUploaded = Math.max(0, (this.photosUploaded || 0) - 1);
  this.storageUsed = Math.max(0, (this.storageUsed || 0) - sizeInBytes);
  await this.save();
};

// Virtual for checking if event is in the past
eventSchema.virtual('isPast').get(function() {
  return this.date < new Date();
});

// Virtual for storage in MB
eventSchema.virtual('storageUsedMB').get(function() {
  return ((this.storageUsed || 0) / (1024 * 1024)).toFixed(2);
});

// Indexes for better query performance
eventSchema.index({ organizer: 1, createdAt: -1 });
eventSchema.index({ qrCode: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema);
