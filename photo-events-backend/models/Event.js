const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
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
    // ✅ ADD THIS FIELD
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for registration count
eventSchema.virtual('registrationCount', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'event',
  count: true
});

// Virtual for photo count
eventSchema.virtual('photoCount', {
  ref: 'Photo',
  localField: '_id',
  foreignField: 'event',
  count: true
});

// Generate unique QR code before saving
eventSchema.pre('save', function (next) {
  if (!this.qrCode) {
    this.qrCode = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Indexes for better query performance
eventSchema.index({ organizer: 1, createdAt: -1 });
eventSchema.index({ qrCode: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema);
