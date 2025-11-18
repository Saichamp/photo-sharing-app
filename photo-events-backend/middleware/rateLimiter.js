/**
 * Rate Limiting Middleware for PhotoManEa
 * Provides different rate limits for different endpoint types
 */

const rateLimit = require('express-rate-limit');
const config = require('../config/config');

/**
 * Store for rate limit violations (for monitoring)
 */
const rateLimitStore = {
  violations: [],
  addViolation: function(ip, endpoint) {
    this.violations.push({
      ip,
      endpoint,
      timestamp: new Date()
    });
    
    // Keep only last 1000 violations
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-1000);
    }
  },
  getViolations: function() {
    return this.violations;
  }
};

/**
 * Custom handler for rate limit exceeded
 */
const rateLimitHandler = (req, res) => {
  const endpoint = req.path;
  const ip = req.ip;
  
  // Log violation
  rateLimitStore.addViolation(ip, endpoint);
  console.warn(`⚠️  Rate limit exceeded: IP=${ip}, Endpoint=${endpoint}`);
  
  res.status(429).json({
    success: false,
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After') || 'Please wait a few minutes'
  });
};

/**
 * Skip rate limiting in certain conditions
 */
const skipRateLimiting = (req) => {
  // Skip for localhost in development
  if (config.server.env === 'development') {
    const localIPs = ['127.0.0.1', '::1', 'localhost'];
    if (localIPs.includes(req.ip)) {
      return true;
    }
  }
  
  // Skip for health check endpoints
  if (req.path === '/api/health' || req.path === '/api/status') {
    return true;
  }
  
  return false;
};

/**
 * General API Rate Limiter
 * Applied to all /api/* routes
 */
const generalLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs, // 15 minutes
  max: config.security.rateLimitMaxRequests,   // 100 requests
  message: {
    success: false,
    error: 'Rate Limit Exceeded',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimiting
});

/**
 * Authentication Rate Limiter
 * For login, register, password reset endpoints
 * Prevents brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful logins
  message: {
    success: false,
    error: 'Authentication Rate Limit Exceeded',
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimiting
});

/**
 * File Upload Rate Limiter
 * Prevents abuse of upload endpoints
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: {
    success: false,
    error: 'Upload Rate Limit Exceeded',
    message: 'Too many file uploads. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimiting
});

/**
 * AI/Face Matching Rate Limiter
 * For computationally expensive operations
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 AI operations per hour
  message: {
    success: false,
    error: 'AI Processing Rate Limit Exceeded',
    message: 'Too many AI processing requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimiting
});

/**
 * Event Creation Rate Limiter
 * Prevents spam event creation
 */
const createEventLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 events per hour
  message: {
    success: false,
    error: 'Event Creation Rate Limit Exceeded',
    message: 'Too many events created. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimiting
});

/**
 * Guest Registration Rate Limiter
 * Prevents spam registrations
 */
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 registrations per hour per IP
  message: {
    success: false,
    error: 'Registration Rate Limit Exceeded',
    message: 'Too many registrations from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimiting
});

/**
 * Strict Rate Limiter (for sensitive operations)
 * Example: Delete operations, admin actions
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    success: false,
    error: 'Strict Rate Limit Exceeded',
    message: 'Too many sensitive operations. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimiting
});

/**
 * Public Endpoint Rate Limiter (more lenient)
 * For public-facing endpoints that don't require auth
 */
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  message: {
    success: false,
    error: 'Rate Limit Exceeded',
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: skipRateLimiting
});

/**
 * Get rate limit violation statistics
 * For admin dashboard
 */
const getRateLimitStats = () => {
  const violations = rateLimitStore.getViolations();
  const now = Date.now();
  const lastHour = violations.filter(v => now - v.timestamp < 3600000);
  const lastDay = violations.filter(v => now - v.timestamp < 86400000);
  
  // Group by IP
  const byIP = violations.reduce((acc, v) => {
    acc[v.ip] = (acc[v.ip] || 0) + 1;
    return acc;
  }, {});
  
  // Group by endpoint
  const byEndpoint = violations.reduce((acc, v) => {
    acc[v.endpoint] = (acc[v.endpoint] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: violations.length,
    lastHour: lastHour.length,
    lastDay: lastDay.length,
    topOffenders: Object.entries(byIP)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count })),
    topEndpoints: Object.entries(byEndpoint)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }))
  };
};

/**
 * Clear rate limit violations (for testing/admin)
 */
const clearRateLimitStats = () => {
  rateLimitStore.violations = [];
  console.log('✅ Rate limit statistics cleared');
};

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  aiLimiter,
  createEventLimiter,
  registrationLimiter,
  strictLimiter,
  publicLimiter,
  getRateLimitStats,
  clearRateLimitStats
};
