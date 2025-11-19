/**
 * Authentication Middleware for PhotoManEa
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { AppError, asyncHandler } = require('./errorHandler');
const { logSecurity, logger } = require('../utils/logger');

/**
 * Main Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  
  // 1. Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // 2. Check if token exists
  if (!token) {
    logSecurity('auth-failed', 'high', {
      reason: 'no-token',
      path: req.path,
      ip: req.ip
    });
    throw new AppError('Authentication required. Please login.', 401);
  }
  
  try {
    // 3. Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 4. Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      logSecurity('auth-failed', 'high', {
        reason: 'user-not-found',
        userId: decoded.id,
        ip: req.ip
      });
      throw new AppError('User no longer exists. Please login again.', 401);
    }
    
    // 5. Check if user is active
    if (!user.isActive) {
      logSecurity('auth-failed', 'high', {
        reason: 'account-inactive',
        userId: user._id,
        email: user.email,
        ip: req.ip
      });
      throw new AppError('Your account has been deactivated.', 403);
    }
    
    // 6. Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      logSecurity('auth-failed', 'medium', {
        reason: 'password-changed',
        userId: user._id,
        ip: req.ip
      });
      throw new AppError('Password recently changed. Please login again.', 401);
    }
    
    // 7. Attach user to request object
    req.user = user;
    
    // 8. Log successful authentication (debug level)
    logger.debug('User authenticated', {
      userId: user._id,
      email: user.email,
      path: req.path
    });
    
    next();
    
  } catch (error) {
    // Handle JWT-specific errors
    if (error.name === 'JsonWebTokenError') {
      logSecurity('auth-failed', 'high', {
        reason: 'invalid-token',
        error: error.message,
        ip: req.ip
      });
      throw new AppError('Invalid token. Please login again.', 401);
    }
    
    if (error.name === 'TokenExpiredError') {
      logSecurity('auth-failed', 'medium', {
        reason: 'token-expired',
        ip: req.ip
      });
      throw new AppError('Token expired. Please login again.', 401);
    }
    
    // Re-throw AppError or other errors
    throw error;
  }
});

/**
 * Role-based Access Control Middleware
 * Restricts access to specific user roles
 * 
 * Usage: router.get('/admin', authenticate, restrictTo('admin'), handler)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated first
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    
    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      logSecurity('access-denied', 'medium', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
        ip: req.ip
      });
      
      throw new AppError('You do not have permission to perform this action', 403);
    }
    
    next();
  };
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't fail if not present
 * Useful for routes that work both with/without auth
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // If no token, continue without user
  if (!token) {
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id);
    
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed', { error: error.message });
  }
  
  next();
});

/**
 * Verify User Owns Resource Middleware
 * Ensures user can only access their own resources
 * 
 * Usage: router.get('/events/:id', authenticate, verifyOwnership(Event, 'userId'), handler)
 */
const verifyOwnership = (Model, userField = 'userId') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params.id;
    
    if (!resourceId) {
      throw new AppError('Resource ID is required', 400);
    }
    
    const resource = await Model.findById(resourceId);
    
    if (!resource) {
      throw new AppError('Resource not found', 404);
    }
    
    // Check if user owns the resource
    const resourceUserId = resource[userField]?.toString();
    const requestUserId = req.user._id.toString();
    
    if (resourceUserId !== requestUserId && req.user.role !== 'admin') {
      logSecurity('unauthorized-access', 'high', {
        userId: req.user._id,
        resourceId,
        resourceType: Model.modelName,
        ip: req.ip
      });
      
      throw new AppError('You do not have permission to access this resource', 403);
    }
    
    // Attach resource to request for later use
    req.resource = resource;
    
    next();
  });
};

/**
 * Check User Quota Middleware
 * Ensures user hasn't exceeded their plan limits
 */
const checkQuota = (quotaType = 'events') => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }
    
    if (quotaType === 'events') {
      if (!req.user.canCreateEvent()) {
        logSecurity('quota-exceeded', 'medium', {
          userId: req.user._id,
          quotaType: 'events',
          used: req.user.quota.eventsUsed,
          limit: req.user.quota.eventsLimit
        });
        
        throw new AppError(
          `Event limit reached (${req.user.quota.eventsUsed}/${req.user.quota.eventsLimit}). Please upgrade your plan.`,
          403
        );
      }
    }
    
    if (quotaType === 'storage') {
      // Check will be done when file size is known
      req.checkStorage = (requiredBytes) => {
        if (!req.user.hasStorageSpace(requiredBytes)) {
          throw new AppError(
            'Storage limit reached. Please upgrade your plan.',
            403
          );
        }
      };
    }
    
    next();
  });
};

module.exports = {
  authenticate,
  restrictTo,
  optionalAuth,
  verifyOwnership,
  checkQuota
};
