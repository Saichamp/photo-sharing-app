/**
 * Enhanced Error Handler Middleware for PhotoManEa
 * Handles all types of errors with appropriate responses
 */

const config = require('../config/config');

/**
 * Custom Application Error Class
 * Use this for controlled errors throughout the app
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error Types Mapping
 */
const ERROR_TYPES = {
  // Validation Errors
  VALIDATION_ERROR: { statusCode: 400, message: 'Validation failed' },
  INVALID_INPUT: { statusCode: 400, message: 'Invalid input provided' },
  MISSING_FIELD: { statusCode: 400, message: 'Required field missing' },
  
  // Authentication & Authorization
  UNAUTHORIZED: { statusCode: 401, message: 'Authentication required' },
  INVALID_TOKEN: { statusCode: 401, message: 'Invalid or expired token' },
  FORBIDDEN: { statusCode: 403, message: 'Access forbidden' },
  
  // Resource Errors
  NOT_FOUND: { statusCode: 404, message: 'Resource not found' },
  ALREADY_EXISTS: { statusCode: 409, message: 'Resource already exists' },
  
  // File Errors
  FILE_TOO_LARGE: { statusCode: 413, message: 'File size exceeds limit' },
  INVALID_FILE_TYPE: { statusCode: 415, message: 'Invalid file type' },
  
  // Rate Limiting
  TOO_MANY_REQUESTS: { statusCode: 429, message: 'Too many requests' },
  
  // Server Errors
  INTERNAL_ERROR: { statusCode: 500, message: 'Internal server error' },
  DATABASE_ERROR: { statusCode: 500, message: 'Database operation failed' },
  EXTERNAL_API_ERROR: { statusCode: 502, message: 'External service error' },
  
  // AI/Processing Errors
  FACE_DETECTION_FAILED: { statusCode: 422, message: 'No face detected in image' },
  AI_PROCESSING_ERROR: { statusCode: 500, message: 'AI processing failed' }
};

/**
 * Handle Mongoose Validation Errors
 */
const handleMongooseValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose Duplicate Key Errors
 */
const handleMongooseDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists. Please use a different value.`;
  return new AppError(message, 409);
};

/**
 * Handle Mongoose Cast Errors (Invalid ObjectId)
 */
const handleMongooseCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT Errors
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

/**
 * Handle JWT Expired Error
 */
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

/**
 * Handle Multer File Upload Errors
 */
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File size too large. Maximum size is 10MB.', 413);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files. Maximum is 100 files per upload.', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected field in file upload.', 400);
  }
  return new AppError(`File upload error: ${err.message}`, 400);
};

/**
 * Send Error Response in Development
 * Includes full stack trace and error details
 */
const sendErrorDev = (err, req, res) => {
  console.error('💥 ERROR DETAILS:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.name,
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send Error Response in Production
 * Only sends safe, user-friendly messages
 */
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    console.error(`⚠️  Operational Error [${err.statusCode}]: ${err.message} - ${req.path}`);
    
    res.status(err.statusCode).json({
      success: false,
      error: err.name || 'Error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  } 
  // Programming or unknown error: don't leak details
  else {
    console.error('💥 CRITICAL ERROR:', {
      error: err,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Something went wrong. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Log Error to External Service (Future: Sentry, LogRocket, etc.)
 */
const logErrorToService = (err, req) => {
  // TODO: Integrate with Sentry or similar service in Phase 9
  if (config.logging.sentryDsn) {
    // Sentry.captureException(err);
  }
  
  // For now, just log to console
  if (!err.isOperational) {
    console.error('🚨 NON-OPERATIONAL ERROR:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Main Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  // Set default values
  err.statusCode = err.statusCode || 500;
  err.name = err.name || 'Error';

  // Create a copy of error for processing
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.stack = err.stack;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = handleMongooseValidationError(err);
  }
  if (err.code === 11000) {
    error = handleMongooseDuplicateKeyError(err);
  }
  if (err.name === 'CastError') {
    error = handleMongooseCastError(err);
  }
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  if (err.name === 'MulterError') {
    error = handleMulterError(err);
  }

  // Log error to external service (if configured)
  logErrorToService(error, req);

  // Send response based on environment
  if (config.server.env === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

/**
 * Handle 404 - Route Not Found
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    404
  );
  next(error);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create Standardized Error Response
 * Helper function for controllers
 */
const createError = (type, customMessage = null) => {
  const errorType = ERROR_TYPES[type] || ERROR_TYPES.INTERNAL_ERROR;
  const message = customMessage || errorType.message;
  return new AppError(message, errorType.statusCode);
};

/**
 * Success Response Helper
 * Standardized success response format
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  createError,
  successResponse,
  ERROR_TYPES
};
