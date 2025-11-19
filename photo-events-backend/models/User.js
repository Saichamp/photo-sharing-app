/**
 * User Model for PhotoManEa
 * Handles event organizers authentication
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password by default in queries
  },
  
  role: {
    type: String,
    enum: ['organizer', 'admin'],
    default: 'organizer'
  },
  
  // Subscription & Quota Management (Phase 5)
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active'
    },
    expiresAt: {
      type: Date,
      default: null
    },
    stripeCustomerId: {
      type: String,
      default: null
    }
  },
  
  // Usage Quotas
  quota: {
    eventsUsed: {
      type: Number,
      default: 0
    },
    eventsLimit: {
      type: Number,
      default: 3 // Free plan: 3 events
    },
    storageUsed: {
      type: Number,
      default: 0 // In bytes
    },
    storageLimit: {
      type: Number,
      default: 1073741824 // 1GB for free plan
    }
  },
  
  // Account Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Security
  lastLogin: {
    type: Date,
    default: null
  },
  
  passwordChangedAt: {
    type: Date
  },
  
  passwordResetToken: {
    type: String
  },
  
  passwordResetExpires: {
    type: Date
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Indexes for Performance
 */
//UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

/**
 * Pre-save Middleware: Hash Password
 */
/**
 * Pre-save Middleware: Hash Password
 */
UserSchema.pre('save', async function(next) {
  // Only hash password if it's modified AND has a value
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


/**
 * Pre-save Middleware: Update passwordChangedAt
 */
UserSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  // Set passwordChangedAt to now (minus 1 second to ensure JWT is issued after)
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/**
 * Instance Method: Compare Password
 */
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Instance Method: Check if password changed after JWT issued
 */
UserSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Instance Method: Check quota availability
 */
UserSchema.methods.canCreateEvent = function() {
  return this.quota.eventsUsed < this.quota.eventsLimit;
};

/**
 * Instance Method: Check storage availability
 */
UserSchema.methods.hasStorageSpace = function(requiredBytes) {
  return (this.quota.storageUsed + requiredBytes) <= this.quota.storageLimit;
};

/**
 * Instance Method: Increment event usage
 */
UserSchema.methods.incrementEventUsage = async function() {
  this.quota.eventsUsed += 1;
  await this.save();
};

/**
 * Instance Method: Increment storage usage
 */
UserSchema.methods.incrementStorageUsage = async function(bytes) {
  this.quota.storageUsed += bytes;
  await this.save();
};

/**
 * Static Method: Find by credentials
 */
UserSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email }).select('+password');
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isPasswordMatch = await user.comparePassword(password);
  
  if (!isPasswordMatch) {
    throw new Error('Invalid email or password');
  }
  
  return user;
};

/**
 * Virtual: Get quota usage percentage
 */
UserSchema.virtual('quotaUsagePercent').get(function() {
  if (this.quota.eventsLimit === 0) return 0;
  return Math.round((this.quota.eventsUsed / this.quota.eventsLimit) * 100);
});

/**
 * Virtual: Get storage usage percentage
 */
UserSchema.virtual('storageUsagePercent').get(function() {
  if (this.quota.storageLimit === 0) return 0;
  return Math.round((this.quota.storageUsed / this.quota.storageLimit) * 100);
});

module.exports = mongoose.model('User', UserSchema);
