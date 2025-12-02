const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // NEW: User/Organizer who created the event
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event must belong to a user'],
    index: true // For fast queries by user
  },
  
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
  
  // NEW: Location field
  location: {
    type: String,
    default: 'Not specified'
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
  
  // NEW: Storage tracking
  storageUsed: {
    type: Number,
    default: 0 // In bytes
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  organizerEmail: {
    type: String,
    required: true
  },
  
  // NEW: Settings
  settings: {
    allowGuestDownload: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxPhotosPerGuest: {
      type: Number,
      default: 100
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Indexes for Performance
 */
eventSchema.index({ userId: 1, createdAt: -1 }); // User's events sorted by date
eventSchema.index({ status: 1 }); // Filter by status
eventSchema.index({ date: 1 }); // Sort by event date

/**
 * Virtual: Get formatted date
 */
eventSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

/**
 * Virtual: Get storage used in MB
 */
eventSchema.virtual('storageUsedMB').get(function() {
  return (this.storageUsed / (1024 * 1024)).toFixed(2);
});

/**
 * Virtual: Check if event is past
 */
eventSchema.virtual('isPast').get(function() {
  return this.date < new Date();
});

/**
 * Instance Method: Increment registration count
 */
eventSchema.methods.incrementRegistration = async function() {
  this.registrationCount += 1;
  await this.save();
};

/**
 * Instance Method: Increment photo count and storage
 */
/**
 * Instance Method: Increment photo count and storage
 * ✅ FIXED: Now accepts count parameter
 */
eventSchema.methods.incrementPhotoStats = async function(fileSize, count = 1) {
  this.photosUploaded += count; // ✅ Add count, not just 1
  this.storageUsed += fileSize;
  await this.save();
};


/**
 * Instance Method: Update status based on date
 */
eventSchema.methods.updateStatus = async function() {
  const now = new Date();
  const eventDate = new Date(this.date);
  const dayAfterEvent = new Date(eventDate);
  dayAfterEvent.setDate(dayAfterEvent.getDate() + 1);
  
  if (now < eventDate) {
    this.status = 'upcoming';
  } else if (now >= eventDate && now < dayAfterEvent) {
    this.status = 'active';
  } else {
    this.status = 'completed';
  }
  
  await this.save();
};

/**
 * Pre-save Middleware: Auto-update status
 */
eventSchema.pre('save', function(next) {
  const now = new Date();
  const eventDate = new Date(this.date);
  
  if (now < eventDate) {
    this.status = 'upcoming';
  } else if (now.toDateString() === eventDate.toDateString()) {
    this.status = 'active';
  } else if (now > eventDate) {
    this.status = 'completed';
  }
  
  next();
});

module.exports = mongoose.model('Event', eventSchema);
