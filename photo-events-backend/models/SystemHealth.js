/**
 * SystemHealth Model - Phase 1 Admin Panel
 * Real-time system monitoring & alerts
 * File: backend/models/SystemHealth.js
 */

const mongoose = require('mongoose');

const systemHealthSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  cpu: { type: Number, min: 0, max: 100 },        // CPU %
  memory: { 
    used: Number,     // MB
    total: Number,    // MB
    percentage: Number
  },
  disk: {
    used: Number,     // GB
    total: Number,    // GB
    percentage: Number
  },
  services: {
    database: { status: String, responseTime: Number },  // ms
    faceService: { status: String, queueLength: Number },
    api: { uptime: Number, errorRate: Number }           // seconds, %
  },
  metrics: {
    activeUsers: Number,
    processingPhotos: Number,
    failedPhotos: Number,
    avgProcessTime: Number  // seconds
  },
  status: {
    type: String,
    enum: ['healthy', 'warning', 'critical'],
    default: 'healthy'
  },
  alerts: [{
    type: String,      // cpu-high, disk-full, etc.
    message: String,
    severity: String   // low, medium, high
  }]
}, {
  timestamps: true
});

// TTL index - keep 7 days of health data
systemHealthSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Latest health status
systemHealthSchema.statics.getLatest = async function() {
  return await this.findOne().sort({ timestamp: -1 }).lean();
};

// Health trend (last 24 hours)
systemHealthSchema.statics.getTrend = async function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return await this.find({ timestamp: { $gte: since } })
    .sort({ timestamp: 1 })
    .select('timestamp cpu memory services status')
    .lean();
};

module.exports = mongoose.model('SystemHealth', systemHealthSchema);
