/**
 * Security Configuration for PhotoManEa
 * Express 5 compatible version (without express-mongo-sanitize, xss-clean, hpp)
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');

/**
 * Helmet Configuration
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
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

/**
 * CORS Configuration
 */
const corsConfig = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = config.security.corsOrigin.split(',').map(o => o.trim());

    if (config.server.env === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.security.corsCredentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
});

/**
 * Rate Limiting
 */
const generalLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.server.env === 'development' && req.ip === '127.0.0.1'
});

/**
 * MongoDB Injection Protection (Patched)
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
  // Convert null-prototype objects to plain objects if needed
  if (Object.getPrototypeOf(obj) === null) {
    obj = Object.assign({}, obj);
  }
  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const sanitizedKey = key.replace(/[$\.]/g, '');
      sanitized[sanitizedKey] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
};

const mongoSanitizeConfig = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

/**
 * XSS Protection (Patched)
 */
const cleanXSS = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    }
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(item => cleanXSS(item));
  // Convert null-prototype objects to plain objects if needed
  if (Object.getPrototypeOf(obj) === null) {
    obj = Object.assign({}, obj);
  }
  const cleaned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cleaned[key] = cleanXSS(obj[key]);
    }
  }
  return cleaned;
};

const xssConfig = (req, res, next) => {
  if (req.body) req.body = cleanXSS(req.body);
  if (req.query) req.query = cleanXSS(req.query);
  if (req.params) req.params = cleanXSS(req.params);
  next();
};

/**
 * HTTP Parameter Pollution Protection
 */
const hppConfig = (req, res, next) => {
  const whitelist = ['eventId', 'status', 'sort', 'limit', 'page', 'faceMatchThreshold'];
  if (req.query) {
    for (const key in req.query) {
      if (!whitelist.includes(key) && Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
  }
  next();
};

/**
 * Security Headers
 */
const securityHeaders = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (req.path.includes('/api/auth') || req.path.includes('/api/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  next();
};

/**
 * Request Logger
 */
const requestLogger = (req, res, next) => {
  if (config.server.env === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
};

/**
 * Apply Security
 */
const applySecurity = (app) => {
  app.use(requestLogger);
  app.use(helmetConfig);
  app.use(corsConfig);
  app.use(mongoSanitizeConfig);
  app.use(xssConfig);
  app.use(hppConfig);
  app.use(securityHeaders);
  app.use('/api/', generalLimiter);

  console.log('✅ Security middleware configured successfully');
};

module.exports = {
  applySecurity,
  corsConfig,
  helmetConfig,
  generalLimiter,
  securityHeaders
};
