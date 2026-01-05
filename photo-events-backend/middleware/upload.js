/**
 * File Upload Middleware using Multer
 * Handles photo uploads with validation
 * Separate configurations for selfies and event photos
 * 
 * EVENT PHOTOS: UNLIMITED size & count
 * SELFIES: 10MB limit (single file)
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const { AppError } = require('./errorHandler');

// ========================================
// DIRECTORY SETUP
// ========================================

const uploadDir = config.upload?.uploadDir || './uploads';
const photosDir = path.join(uploadDir, 'photos');
const selfiesDir = path.join(uploadDir, 'selfies');

// Create directories if they don't exist
[uploadDir, photosDir, selfiesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// ========================================
// STORAGE CONFIGURATIONS
// ========================================

/**
 * Storage for EVENT PHOTOS
 * Stores in: uploads/photos/
 */
const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, photosDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 50);
    cb(null, `photo-${uniqueSuffix}-${sanitizedName}${ext}`);
  }
});

/**
 * Storage for SELFIES (Guest Registration)
 * Stores in: uploads/selfies/
 */
const selfieStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, selfiesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `selfie-${uniqueSuffix}${ext}`);
  }
});

// ========================================
// FILE VALIDATION
// ========================================

/**
 * Allowed image types
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/tiff'
];

/**
 * File Filter - Only allow images
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.upload?.allowedTypes || ALLOWED_IMAGE_TYPES;
  
  // Check MIME type
  if (allowedTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    // Check file extension as fallback
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.bmp', '.tiff'];
    
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new AppError(`Invalid file type: ${file.mimetype}. Only images are allowed.`, 400), false);
    }
  }
};

// ========================================
// MULTER CONFIGURATIONS
// ========================================

/**
 * 🔥 EVENT PHOTOS UPLOAD - UNLIMITED
 * - NO file size limit
 * - NO file count limit
 * - Use for bulk photo uploads
 */
const uploadPhotos = multer({
  storage: photoStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: Infinity,        // ✅ NO SIZE LIMIT
    files: Infinity,           // ✅ NO FILE COUNT LIMIT
    fields: 10,                // Max form fields
    fieldSize: 10 * 1024 * 1024, // 10MB per field value
    parts: Infinity            // ✅ NO PARTS LIMIT
  }
});

/**
 * SELFIE UPLOAD - Limited (for guest registration)
 * - 10MB max per selfie
 * - Single file only
 */
const uploadSelfie = multer({
  storage: selfieStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for selfies
    files: 1                     // Single file only
  }
});

// ========================================
// ERROR HANDLER
// ========================================

/**
 * Multer Error Handler Middleware
 * Converts Multer errors to friendly messages
 */
const handleMulterError = (err, req, res, next) => {
  // Log error for debugging
  if (err) {
    console.error('🔴 Multer Error:', {
      code: err.code,
      message: err.message,
      field: err.field
    });
  }

  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new AppError(
          `File too large. Maximum size: ${formatBytes(err.limit || 10485760)}`,
          413
        ));

      case 'LIMIT_FILE_COUNT':
        return next(new AppError(
          `Too many files. Maximum: ${err.limit} files`,
          400
        ));

      case 'LIMIT_FIELD_KEY':
        return next(new AppError('Field name too long', 400));

      case 'LIMIT_FIELD_VALUE':
        return next(new AppError('Field value too long', 400));

      case 'LIMIT_FIELD_COUNT':
        return next(new AppError('Too many fields', 400));

      case 'LIMIT_UNEXPECTED_FILE':
        return next(new AppError(
          `Unexpected field: "${err.field}". Expected field name: "photos" or "selfie"`,
          400
        ));

      case 'LIMIT_PART_COUNT':
        return next(new AppError('Too many parts in multipart form', 400));

      default:
        return next(new AppError(`Upload error: ${err.message}`, 400));
    }
  }

  // Handle other errors (like invalid file type from fileFilter)
  if (err instanceof AppError) {
    return next(err);
  }

  // Pass other errors to global error handler
  if (err) {
    return next(err);
  }

  next();
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Main upload instances
  uploadPhotos,      // For event photos (unlimited)
  uploadSelfie,      // For selfies (10MB limit)
  
  // Middleware for specific routes
  uploadPhotosMiddleware: uploadPhotos.array('photos'),  // ✅ Use this for /photos/upload
  uploadSelfieMiddleware: uploadSelfie.single('selfie'), // ✅ Use this for /registrations
  
  // Error handler
  handleMulterError,
  
  // Utility
  formatBytes,
  
  // Constants (for reference)
  ALLOWED_IMAGE_TYPES,
  photosDir,
  selfiesDir
};
