/**
 * AdminLog Model - Phase 1 Admin Panel
 * Tracks all admin actions for complete audit trail
 * File: backend/models/AdminLog.js
 */

const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_VIEWED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
      'USER_DISABLED', 'USER_ENABLED', 'PASSWORD_RESET', 
      'SUBSCRIPTION_UPDATED', 'PHOTO_RETRY', 'SYSTEM_CHECK'
    ]
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success'
  }
}, {
  timestamps: true
});

// Compound indexes for fast queries
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ targetUserId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });

// Static method to log admin actions (used everywhere)
adminLogSchema.statics.createLog = async function(data) {
  const log = new this(data);
  await log.save();
  return log;
};

// Recent activity for dashboard
adminLogSchema.statics.getRecentActivity = async function(limit = 50) {
  return await this.find()
    .populate('adminId', 'name email')
    .populate('targetUserId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model('AdminLog', adminLogSchema);
