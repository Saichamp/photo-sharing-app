/**
 * Centralized Configuration for PhotoManEa Backend
 * All environment variables are loaded and validated here
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || '0.0.0.0',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    maxFiles: parseInt(process.env.MAX_FILES, 10) || 100,
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(','),
    facesDir: './uploads/faces',
    photosDir: './uploads/photos'
  },

  // Face Recognition Settings
  faceRecognition: {
    matchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD) || 0.4,
    minFaceSize: parseInt(process.env.FACE_MIN_SIZE, 10) || 20,
    detectionConfidence: parseFloat(process.env.FACE_DETECTION_CONFIDENCE) || 0.5,
    maxFacesPerPhoto: parseInt(process.env.MAX_FACES_PER_PHOTO, 10) || 50,
    pythonPath: process.env.PYTHON_PATH || 'python3',
    timeout: 30000 // 30 seconds
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: {
      name: process.env.SMTP_FROM_NAME || 'PhotoManEa',
      email: process.env.SMTP_FROM_EMAIL || 'noreply@photomanea.cloud'
    },
    // SendGrid alternative
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL
    }
  },

  // Security & Rate Limiting
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 min
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    sessionSecret: process.env.SESSION_SECRET,
    sessionMaxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE, 10) || 86400000, // 24h
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    corsCredentials: process.env.CORS_CREDENTIALS === 'true'
  },

  // Payment (Stripe - Phase 5)
  payment: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },

  // WhatsApp API (Phase 6)
  whatsapp: {
    apiKey: process.env.WHATSAPP_API_KEY,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID
  },

  // Logging & Monitoring
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    sentryDsn: process.env.SENTRY_DSN
  },

  // Cloud Storage (Phase 5+)
  cloudStorage: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      s3Bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || 'us-east-1'
    }
  }
};

// Validation: Ensure critical environment variables exist
const validateConfig = () => {
  const required = [
    { key: 'MONGODB_URI', value: config.database.uri },
    { key: 'JWT_SECRET', value: config.jwt.secret }
  ];

  const missing = required.filter(({ value }) => !value);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(({ key }) => console.error(`   - ${key}`));
    process.exit(1);
  }

  // Warn about development mode in production
  if (config.server.env === 'production') {
    if (!config.security.sessionSecret) {
      console.warn('⚠️  SESSION_SECRET not set in production');
    }
    if (config.security.corsOrigin.includes('localhost')) {
      console.warn('⚠️  CORS_ORIGIN still points to localhost in production');
    }
  }
};

// Run validation
validateConfig();

module.exports = config;
