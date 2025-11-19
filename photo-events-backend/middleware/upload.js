/**
 * File Upload Middleware using Multer
 * Handles photo uploads with validation
 */

const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const { AppError } = require('./errorHandler');

// Ensure upload directories exist
const fs = require('fs');
const uploadDir = config.upload.uploadDir || './uploads';
const photosDir = path.join(uploadDir, 'photos');
const facesDir = path.join(uploadDir, 'faces');

[uploadDir, photosDir, facesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Storage Configuration
 */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store photos in photos subdirectory
    cb(null, photosDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + '-' + uniqueSuffix + ext);
  }
});

/**
 * File Filter - Only allow images
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedTypes || [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.', 400), false);
  }
};

/**
 * Multer Upload Instance
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize || 10485760, // 10MB default
    files: config.upload.maxFiles || 100
  }
});

/**
 * Error Handler for Multer
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size too large. Maximum size is 10MB.', 413));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Too many files. Maximum is 100 files per upload.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field in file upload.', 400));
    }
    return next(new AppError(`Upload error: ${err.message}`, 400));
  }
  next(err);
};

// Export multer instance directly (NOT wrapped in object)
module.exports = upload;

// Also export error handler
module.exports.handleMulterError = handleMulterError;
