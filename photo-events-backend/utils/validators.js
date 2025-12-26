/**
 * Input Validation Utilities for PhotoManEa
 * Provides validation functions for all user inputs
 */

const mongoose = require('mongoose');
const { AppError } = require('../middleware/errorHandler');

/**
 * Email Validation
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

/**
 * Phone Number Validation (International format)
 */
const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Accepts formats: +91 9876543210, +1-234-567-8900, 9876543210, etc.
  const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone.trim());
};

/**
 * MongoDB ObjectId Validation (using mongoose)
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  
  // Use mongoose validation if available
  if (mongoose && mongoose.Types && mongoose.Types.ObjectId) {
    return mongoose.Types.ObjectId.isValid(id);
  }
  
  // Fallback to regex validation
  if (typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate and sanitize ObjectId
 * Throws error if invalid
 */
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    throw new Error(`${fieldName} is required`);
  }
  
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ${fieldName} format`);
  }
  
  return id;
};

/**
 * Name Validation (2-50 characters, letters, spaces, hyphens)
 */
const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 50) return false;
  
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(trimmedName);
};

/**
 * Password Strength Validation
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber;
};

/**
 * URL Validation
 */
const isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

/**
 * Date Validation (checks if date is valid and not in past)
 */
const isValidFutureDate = (date) => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) return false; // Invalid date
  
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset time to start of day
  
  return dateObj >= now;
};

/**
 * File Type Validation
 */
const isValidImageType = (mimetype) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(mimetype);
};

/**
 * File Size Validation
 */
const isValidFileSize = (size, maxSize = 10485760) => { // Default 10MB
  return size > 0 && size <= maxSize;
};

/**
 * Sanitize String (remove HTML tags, trim whitespace)
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

/**
 * Sanitize Email
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Event Validation Schema
 */
const validateEventData = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.name || !sanitizeString(data.name)) {
    errors.push('Event name is required');
  } else if (data.name.length < 3 || data.name.length > 100) {
    errors.push('Event name must be between 3 and 100 characters');
  }
  
  // Date validation
  if (!data.date) {
    errors.push('Event date is required');
  } else if (!isValidFutureDate(data.date)) {
    errors.push('Event date must be today or in the future');
  }
  
  // Expected guests validation
  if (!data.expectedGuests) {
    errors.push('Expected guests count is required');
  } else {
    const guests = parseInt(data.expectedGuests, 10);
    if (isNaN(guests) || guests < 1 || guests > 10000) {
      errors.push('Expected guests must be between 1 and 10,000');
    }
  }
  
  // Organizer email validation
  if (!data.organizerEmail) {
    errors.push('Organizer email is required');
  } else if (!isValidEmail(data.organizerEmail)) {
    errors.push('Invalid organizer email format');
  }
  
  // Description (optional but validate if provided)
  if (data.description && data.description.length > 500) {
    errors.push('Description must not exceed 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Registration Validation Schema
 */
const validateRegistrationData = (data) => {
  const errors = [];
  
  // Name validation
  if (!data.name) {
    errors.push('Name is required');
  } else if (!isValidName(data.name)) {
    errors.push('Name must be 2-50 characters and contain only letters, spaces, and hyphens');
  }
  
  // Email validation
  if (!data.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  // Phone validation
  if (!data.phone) {
    errors.push('Phone number is required');
  } else if (!isValidPhone(data.phone)) {
    errors.push('Invalid phone number format');
  }
  
  // Event ID validation
  if (!data.eventId) {
    errors.push('Event ID is required');
  } else if (!isValidObjectId(data.eventId)) {
    errors.push('Invalid event ID format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * User Authentication Validation Schema
 */
/**
 * Validate authentication data (login/register)
 */
const validateAuthData = (req, res, next) => {
  // SAFE: Always check if req.body exists first
  const body = req.body || {};
  const { email, password, name } = body;

  const errors = {};

  // Name validation (for register only)
  if (name !== undefined) {
    if (!name || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
  }

  // Email validation
  if (!email || !email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!password || !password.trim()) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  // If any errors, return 400
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Attach validated data to request for convenience
  req.validatedData = { email: email.trim(), password: password.trim() };
  next();
};


/**
 * Photo Upload Validation
 */
const validatePhotoUpload = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  // File type validation
  if (!isValidImageType(file.mimetype)) {
    errors.push('Invalid file type. Only JPEG, PNG, and WebP are allowed');
  }
  
  // File size validation (10MB max)
  if (!isValidFileSize(file.size, 10485760)) {
    errors.push('File size exceeds 10MB limit');
  }
  
  // Check if file has data
  if (file.size === 0) {
    errors.push('File is empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate Query Parameters
 */
const validateQueryParams = (params, allowedParams) => {
  const errors = [];
  
  Object.keys(params).forEach(key => {
    if (!allowedParams.includes(key)) {
      errors.push(`Invalid query parameter: ${key}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Pagination Validation
 */
const validatePagination = (page, limit) => {
  const errors = [];
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  
  if (page && (isNaN(pageNum) || pageNum < 1)) {
    errors.push('Page must be a positive integer');
  }
  
  if (limit && (isNaN(limitNum) || limitNum < 1 || limitNum > 100)) {
    errors.push('Limit must be between 1 and 100');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    page: pageNum || 1,
    limit: limitNum || 20
  };
};

/**
 * Express Middleware: Validate Request Body
 */
// In utils/validators.js
const validateBody = (type) => {
  switch(type) {
    case 'login':
      return validateAuthData;
    case 'signup':
      return validateAuthData; // Same as login but also validates name
    case 'updateProfile':
      return validateUpdateProfile;
    case 'changePassword':
      return validateChangePassword;
    default:
      return (req, res, next) => next();
  }
};

module.exports = { validateBody, validateAuthData /* other exports */ };


/**
 * Express Middleware: Validate ObjectId Parameter
 */
const validateObjectIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!isValidObjectId(id)) {
      throw new AppError(`Invalid ${paramName} format`, 400);
    }
    
    next();
  };
};

/**
 * Express Middleware: Validate File Upload
 */
const validateFileUpload = (fieldName = 'file') => {
  return (req, res, next) => {
    const file = req.file || (req.files && req.files[0]);
    
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }
    
    const validation = validatePhotoUpload(file);
    
    if (!validation.isValid) {
      throw new AppError(validation.errors.join('. '), 400);
    }
    
    next();
  };
};

/**
 * Validate Face Embedding Array
 */
const isValidEmbedding = (embedding) => {
  if (!Array.isArray(embedding)) return false;
  if (embedding.length !== 512) return false;
  return embedding.every(val => typeof val === 'number' && !isNaN(val));
};

/**
 * Validate Face Match Threshold
 */
const isValidThreshold = (threshold) => {
  const num = parseFloat(threshold);
  return !isNaN(num) && num >= 0 && num <= 1;
};

module.exports = {
  // Basic validators
  isValidEmail,
  isValidPhone,
  isValidObjectId,
  validateObjectId,
  isValidName,
  isStrongPassword,
  isValidURL,
  isValidFutureDate,
  isValidImageType,
  isValidFileSize,
  isValidEmbedding,
  isValidThreshold,
  
  // Sanitizers
  sanitizeString,
  sanitizeEmail,
  
  // Schema validators
  validateEventData,
  validateRegistrationData,
  validateAuthData,
  validatePhotoUpload,
  validateQueryParams,
  validatePagination,
  
  // Express middlewares
  validateBody,
  validateObjectIdParam,
  validateFileUpload
};