/**
 * File Upload Middleware using Multer
 * Handles photo uploads with validation
 * Separate configurations for selfies and event photos
 */

const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const { AppError } = require('./errorHandler');

// Ensure upload directories exist
const fs = require('fs');
const uploadDir = config.upload.uploadDir || './uploads';
const photosDir = path.join(uploadDir, 'photos');
const selfiesDir = path.join(uploadDir, 'selfies'); // ✅ NEW: Separate folder for selfies

[uploadDir, photosDir, selfiesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * ✅ Storage Configuration for EVENT PHOTOS
 */
const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, photosDir); // Event photos → uploads/photos
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `photo-${uniqueSuffix}${ext}`); // ✅ Prefix: photo-
  }
});

/**
 * ✅ Storage Configuration for SELFIES (Guest Registration)
 */
const selfieStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, selfiesDir); // Selfies → uploads/selfies
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `selfie-${uniqueSuffix}${ext}`); // ✅ Prefix: selfie-
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
 * ✅ Multer Upload Instance for EVENT PHOTOS (bulk upload)
 */
const uploadPhotos = multer({
  storage: photoStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize || 10485760, // 10MB
    files: config.upload.maxFiles || 100
  }
});

/**
 * ✅ Multer Upload Instance for SELFIES (single file)
 */
const uploadSelfie = multer({
  storage: selfieStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5242880, // 5MB for selfies
    files: 1 // Only 1 selfie per registration
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

// ✅ Export both upload configurations
module.exports = {
  uploadPhotos,   // For bulk event photo uploads
  uploadSelfie,   // For guest registration selfies
  handleMulterError
};
