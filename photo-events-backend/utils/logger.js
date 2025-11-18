/**
 * Winston Logger Configuration for PhotoManEa
 * Provides structured logging with file rotation
 */

const winston = require('winston');
const path = require('path');
const config = require('../config/config');

/**
 * Custom Log Format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

/**
 * Console Log Format (Human-readable for development)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

/**
 * Create logs directory if it doesn't exist
 */
const logsDir = path.join(__dirname, '../logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Winston Logger Instance
 */
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'photomanea-backend',
    environment: config.server.env 
  },
  transports: [
    // Write all logs with level 'error' to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Write warnings to separate file
    new winston.transports.File({
      filename: path.join(logsDir, 'warnings.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

/**
 * Add console transport in development
 */
if (config.server.env === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Production-only: Add console with simple format
 */
if (config.server.env === 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.simple()
    )
  }));
}

/**
 * Stream for Morgan HTTP Logger Integration
 */
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

/**
 * Helper Functions for Structured Logging
 */

/**
 * Log HTTP Request
 */
const logRequest = (req) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

/**
 * Log HTTP Response
 */
const logResponse = (req, res, responseTime) => {
  logger.info('HTTP Response', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip
  });
};

/**
 * Log Database Operations
 */
const logDatabase = (operation, collection, details = {}) => {
  logger.info('Database Operation', {
    operation,
    collection,
    ...details
  });
};

/**
 * Log Authentication Events
 */
const logAuth = (event, userId, details = {}) => {
  logger.info('Authentication Event', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

/**
 * Log File Operations
 */
const logFile = (operation, filename, details = {}) => {
  logger.info('File Operation', {
    operation,
    filename,
    ...details
  });
};

/**
 * Log AI/Face Recognition Operations
 */
const logAI = (operation, details = {}) => {
  logger.info('AI Operation', {
    operation,
    timestamp: new Date().toISOString(),
    ...details
  });
};

/**
 * Log Security Events
 */
const logSecurity = (event, severity = 'medium', details = {}) => {
  const logLevel = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
  
  logger[logLevel]('Security Event', {
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...details
  });
};

/**
 * Log Performance Metrics
 */
const logPerformance = (operation, duration, details = {}) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...details
  });
};

/**
 * Log Error with Context
 */
const logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    statusCode: error.statusCode,
    ...context
  });
};

/**
 * Express Middleware for Request Logging
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logRequest(req);
  
  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logResponse(req, res, responseTime);
  });
  
  next();
};

/**
 * Get Log Statistics
 * Useful for admin dashboard
 */
const getLogStats = () => {
  const logsPath = path.join(__dirname, '../logs');
  const stats = {};
  
  try {
    const files = fs.readdirSync(logsPath);
    
    files.forEach(file => {
      const filePath = path.join(logsPath, file);
      const fileStat = fs.statSync(filePath);
      
      stats[file] = {
        size: fileStat.size,
        sizeFormatted: `${(fileStat.size / 1024 / 1024).toFixed(2)} MB`,
        modified: fileStat.mtime,
        lines: fs.readFileSync(filePath, 'utf-8').split('\n').length - 1
      };
    });
    
    return stats;
  } catch (error) {
    logger.error('Failed to get log stats', { error: error.message });
    return {};
  }
};

/**
 * Clear Old Logs
 * For maintenance/cleanup
 */
const clearOldLogs = (daysOld = 30) => {
  const logsPath = path.join(__dirname, '../logs');
  const now = Date.now();
  const maxAge = daysOld * 24 * 60 * 60 * 1000;
  
  try {
    const files = fs.readdirSync(logsPath);
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(logsPath, file);
      const fileStat = fs.statSync(filePath);
      
      if (now - fileStat.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    logger.info(`Cleared ${deletedCount} old log files (>${daysOld} days)`);
    return deletedCount;
  } catch (error) {
    logger.error('Failed to clear old logs', { error: error.message });
    return 0;
  }
};

// Export logger and helper functions
module.exports = {
  logger,
  logRequest,
  logResponse,
  logDatabase,
  logAuth,
  logFile,
  logAI,
  logSecurity,
  logPerformance,
  logError,
  requestLogger,
  getLogStats,
  clearOldLogs
};
