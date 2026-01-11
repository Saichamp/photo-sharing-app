/**
 * Authentication Middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

/**
 * Authenticate user via JWT token
 * ALIAS: protect (for compatibility)
 */
const authenticate = async (req, res, next) => {
  try {
    // ✅ DEBUG: Log incoming request
    console.log('🔐 Auth Middleware Check:', {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization,
      authPreview: req.headers.authorization ? req.headers.authorization.substring(0, 30) + '...' : 'NONE',
      timestamp: new Date().toISOString()
    });

    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth failed: No token provided');
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Auth failed: Invalid token format');
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Invalid token format.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token verified successfully for user:', decoded.id);
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.message);
      throw jwtError;
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('❌ User not found for ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User account deactivated:', user._id);
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // ✅ Attach user to request object
    req.user = user;
    console.log('✅ Auth successful - User:', user.email, '| ID:', user._id);
    
    next();

  } catch (error) {
    logger.error('Authentication error', {
      service: 'photomanea-backend',
      error: error.message,
      stack: error.stack
    });

    if (error.name === 'JsonWebTokenError') {
      console.log('❌ Invalid JWT token');
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      console.log('❌ Token expired');
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    console.log('❌ Authentication error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Require admin role middleware
 * Must be used AFTER authenticate middleware
 */
const requireAdmin = (req, res, next) => {
  // Check if user exists (should be set by authenticate middleware)
  if (!req.user) {
    console.log('❌ Admin check: No user in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    console.log('⚠️ Admin check failed:', {
      userId: req.user._id,
      userRole: req.user.role,
      path: req.path
    });
    
    logger.warn('Unauthorized admin access attempt', {
      service: 'photomanea-backend',
      userId: req.user._id,
      userRole: req.user.role,
      path: req.path
    });
    
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  // User is admin, proceed
  console.log('✅ Admin access granted:', req.user.email);
  next();
};

/**
 * Admin-only middleware (standalone version)
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    logger.warn('Admin access denied', {
      service: 'photomanea-backend',
      userId: req.user?._id,
      role: req.user?.role
    });
    
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

/**
 * Organizer or Admin middleware
 */
const organizerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'organizer' || req.user.role === 'admin')) {
    next();
  } else {
    logger.warn('Organizer access denied', {
      service: 'photomanea-backend',
      userId: req.user?._id,
      role: req.user?.role
    });
    
    res.status(403).json({
      success: false,
      message: 'Access denied. Organizer or Admin privileges required.'
    });
  }
};

/**
 * Check quota middleware (for events, photos, etc.)
 */
const checkQuota = (resourceType) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const plan = user.subscription?.plan || 'free';

      // Define limits for each plan
      const limits = {
        free: { events: 3, photos: 100 },
        basic: { events: 10, photos: 1000 },
        premium: { events: 50, photos: 5000 },
        enterprise: { events: Infinity, photos: Infinity }
      };

      const userLimit = limits[plan]?.[resourceType];
      if (!userLimit) {
        return next();
      }

      // Check current usage
      if (resourceType === 'events') {
        const Event = require('../models/Event');
        const eventCount = await Event.countDocuments({ organizer: user._id });
        
        if (eventCount >= userLimit) {
          return res.status(403).json({
            success: false,
            message: `Event limit reached for ${plan} plan. Upgrade to create more events.`,
            currentUsage: eventCount,
            limit: userLimit
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Quota check error', {
        service: 'photomanea-backend',
        error: error.message
      });
      next(error);
    }
  };
};

/**
 * Verify ownership middleware
 */
const verifyOwnership = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const userId = req.user._id;

      const resource = await Model.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${Model.modelName} not found`
        });
      }

      // Check ownership
      const ownerId = resource.organizer || resource.userId || resource.user;
      if (ownerId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resource.'
        });
      }

      // Attach resource to request for later use
      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership verification error', {
        service: 'photomanea-backend',
        error: error.message
      });
      next(error);
    }
  };
};

// Export all middleware
module.exports = {
  authenticate,
  protect: authenticate, // ALIAS for compatibility
  requireAdmin,
  adminOnly,
  organizerOrAdmin,
  checkQuota,
  verifyOwnership
};
