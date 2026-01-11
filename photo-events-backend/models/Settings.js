/**
 * System Settings Model
 * Stores application-wide configuration
 */

const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // General Settings
    general: {
      siteName: {
        type: String,
        default: 'PhotoManea'
      },
      siteDescription: {
        type: String,
        default: 'AI-Powered Event Photo Management'
      },
      siteUrl: {
        type: String,
        default: 'http://localhost:3000'
      },
      contactEmail: {
        type: String,
        default: 'support@photomanea.com'
      },
      supportPhone: {
        type: String,
        default: ''
      },
      logoUrl: {
        type: String,
        default: ''
      },
      timezone: {
        type: String,
        default: 'Asia/Kolkata'
      },
      language: {
        type: String,
        default: 'en'
      }
    },

    // Email Settings
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      provider: {
        type: String,
        enum: ['smtp', 'sendgrid', 'mailgun'],
        default: 'smtp'
      },
      smtp: {
        host: { type: String, default: '' },
        port: { type: Number, default: 587 },
        secure: { type: Boolean, default: false },
        username: { type: String, default: '' },
        password: { type: String, default: '' }
      },
      fromEmail: {
        type: String,
        default: 'noreply@photomanea.com'
      },
      fromName: {
        type: String,
        default: 'PhotoManea'
      }
    },

    // Storage Settings
    storage: {
      maxFileSize: {
        type: Number,
        default: 10 * 1024 * 1024 // 10MB
      },
      allowedFileTypes: {
        type: [String],
        default: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
      },
      maxPhotosPerEvent: {
        type: Number,
        default: 1000
      },
      compressionEnabled: {
        type: Boolean,
        default: true
      },
      compressionQuality: {
        type: Number,
        default: 80
      },
      storageProvider: {
        type: String,
        enum: ['local', 's3', 'cloudinary'],
        default: 'local'
      }
    },

    // Security Settings
    security: {
      passwordMinLength: {
        type: Number,
        default: 8
      },
      passwordRequireUppercase: {
        type: Boolean,
        default: true
      },
      passwordRequireNumbers: {
        type: Boolean,
        default: true
      },
      passwordRequireSpecialChars: {
        type: Boolean,
        default: false
      },
      sessionTimeout: {
        type: Number,
        default: 24 // hours
      },
      maxLoginAttempts: {
        type: Number,
        default: 5
      },
      lockoutDuration: {
        type: Number,
        default: 15 // minutes
      },
      twoFactorEnabled: {
        type: Boolean,
        default: false
      },
      rateLimitEnabled: {
        type: Boolean,
        default: true
      },
      rateLimitRequests: {
        type: Number,
        default: 100
      },
      rateLimitWindow: {
        type: Number,
        default: 15 // minutes
      }
    },

    // Face Recognition Settings
    faceRecognition: {
      enabled: {
        type: Boolean,
        default: true
      },
      provider: {
        type: String,
        enum: ['face-api', 'deepface', 'custom'],
        default: 'face-api'
      },
      matchThreshold: {
        type: Number,
        default: 0.6,
        min: 0,
        max: 1
      },
      detectionModel: {
        type: String,
        enum: ['ssd_mobilenetv1', 'tiny_face_detector', 'mtcnn'],
        default: 'ssd_mobilenetv1'
      },
      maxFacesPerPhoto: {
        type: Number,
        default: 50
      },
      minFaceSize: {
        type: Number,
        default: 80 // pixels
      },
      autoProcessing: {
        type: Boolean,
        default: true
      }
    },

    // Maintenance Mode
    maintenance: {
      enabled: {
        type: Boolean,
        default: false
      },
      message: {
        type: String,
        default: 'System is under maintenance. Please check back soon.'
      },
      allowedIPs: {
        type: [String],
        default: []
      },
      estimatedEnd: {
        type: Date,
        default: null
      }
    },

    // Feature Flags
    features: {
      guestRegistration: {
        type: Boolean,
        default: true
      },
      publicEvents: {
        type: Boolean,
        default: true
      },
      socialSharing: {
        type: Boolean,
        default: true
      },
      downloadPhotos: {
        type: Boolean,
        default: true
      },
      analytics: {
        type: Boolean,
        default: true
      }
    },

    // Last Updated Info
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = await this.create({});
  }
  
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
