/**
 * Security Configuration for PhotoManEa
 * Configures Helmet, CORS, Rate Limiting, and other security middleware
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const config = require('./config');

/**
 * Helmet Configuration - Secure HTTP Headers
 * Protects against common web vulnerabilities
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for image uploads
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow CORS for uploads
});

/**
 * CORS Configuration - Cross-Origin Resource Sharing
 * Controls which domains can access the API
 */
const corsConfig = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = config.security.corsOrigin.split(',').map(o => o.trim());
    
    // In development, allow localhost variants
    if (config.server.env === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.security.corsCredentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // 10 minutes
});

/**
 * Rate Limiting Configuration
 * Prevents brute force attacks and API abuse
 */

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.security.rateLimitWindowMs / 60000) + ' minutes'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for certain IPs (optional)
  skip: (req) => {
    // Skip for localhost in development
    if (config.server.env === 'development' && req.ip === '127.0.0.1') {
      return true;
    }
    return false;
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
    retryAfter: '15 minutes'
  }
});

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Max 50 uploads per hour
  message: {
    success: false,
    message: 'Upload limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  }
});

// Rate limiter for face matching/search (computationally expensive)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Max 30 AI operations per hour
  message: {
    success: false,
    message: 'AI processing limit exceeded. Please try again later.',
    retryAfter: '1 hour'
  }
});

/**
 * MongoDB Injection Protection
 * Sanitizes user input to prevent NoSQL injection attacks
 */
const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized potentially malicious input in ${key}`);
  }
});

/**
 * XSS Protection
 * Cleans user input from malicious scripts
 */
const xssConfig = xss();

/**
 * HTTP Parameter Pollution Protection
 * Prevents parameter pollution attacks
 */
const hppConfig = hpp({
  whitelist: [
    'eventId', 
    'status', 
    'sort', 
    'limit', 
    'page',
    'faceMatchThreshold'
  ] // Parameters that can appear multiple times
});

/**
 * Security Headers Middleware
 * Adds additional custom security headers
 */
const securityHeaders = (req, res, next) => {
  // Remove powered-by header (don't expose tech stack)
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Add cache control for sensitive endpoints
  if (req.path.includes('/api/auth') || req.path.includes('/api/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

/**
 * Request Logging Middleware (Development Only)
 */
const requestLogger = (req, res, next) => {
  if (config.server.env === 'development') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  }
  next();
};

/**
 * Apply all security middleware to Express app
 */
const applySecurity = (app) => {
  // 1. Request logging (development only)
  app.use(requestLogger);
  
  // 2. Helmet - secure HTTP headers
  app.use(helmetConfig);
  
  // 3. CORS - cross-origin requests
  app.use(corsConfig);
  
  // 4. Body parsing security
  app.use(mongoSanitizeConfig); // Prevent NoSQL injection
  app.use(xssConfig);           // Prevent XSS attacks
  app.use(hppConfig);           // Prevent parameter pollution
  
  // 5. Custom security headers
  app.use(securityHeaders);
  
  // 6. General rate limiting (apply to all routes)
  app.use('/api/', generalLimiter);
  
  console.log('✅ Security middleware configured successfully');
};

// Export everything
module.exports = {
  applySecurity,
  corsConfig,
  helmetConfig,
  generalLimiter,
  authLimiter,
  uploadLimiter,
  aiLimiter,
  securityHeaders
};
