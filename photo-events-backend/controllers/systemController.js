// backend/controllers/systemController.js
const SystemHealth = require('../models/SystemHealth');
const Photo = require('../models/Photo');
const Event = require('../models/Event');
const User = require('../models/User');
const { asyncHandler, successResponse } = require('../middleware/errorHandler');
const { getBasicSystemMetrics, pingDatabase, pingFaceService } = require('../utils/systemMonitor');

/**
 * GET /api/admin/system/health
 * Returns latest health snapshot (or builds one on the fly)
 */
exports.getHealth = asyncHandler(async (req, res) => {
  const [basic, dbInfo, faceInfo, counts] = await Promise.all([
    getBasicSystemMetrics(),
    pingDatabase(),
    pingFaceService(),
    Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Photo.countDocuments({ processed: false }),
      Photo.countDocuments({ processingError: { $ne: null } })
    ])
  ]);

  const [totalUsers, totalEvents, processingPhotos, failedPhotos] = counts;

  const status =
    dbInfo.status === 'error' || faceInfo.status === 'error'
      ? 'critical'
      : basic.memory.percentage > 85
      ? 'warning'
      : 'healthy';

  const snapshot = {
    cpu: basic.cpu,
    memory: basic.memory,
    disk: null, // can be filled later if needed
    services: {
      database: dbInfo,
      faceService: faceInfo,
      api: {
        uptime: process.uptime(),
        errorRate: null
      }
    },
    metrics: {
      activeUsers: totalUsers,
      processingPhotos,
      failedPhotos,
      avgProcessTime: null
    },
    status
  };

  // Optionally persist snapshot
  const doc = await SystemHealth.create({
    metrics: snapshot.metrics,
    services: snapshot.services,
    memory: snapshot.memory,
    cpu: snapshot.cpu,
    status
  });

  successResponse(res, { snapshot: doc }, 'System health retrieved successfully');
});

/**
 * GET /api/admin/system/health/trend?hours=24
 */
exports.getHealthTrend = asyncHandler(async (req, res) => {
  const hours = Number(req.query.hours) || 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const trend = await SystemHealth.find({ timestamp: { $gte: since } })
    .sort({ timestamp: 1 })
    .select('timestamp cpu memory status')
    .lean();

  successResponse(res, { trend }, 'System health trend retrieved successfully');
});

/**
 * GET /api/admin/system/summary
 * Lightweight summary for dashboard cards
 */
exports.getSystemSummary = asyncHandler(async (req, res) => {
  const latest = await SystemHealth.findOne().sort({ timestamp: -1 }).lean();

  if (!latest) {
    return successResponse(res, {
      status: 'unknown',
      lastCheck: null
    }, 'No health data yet');
  }

  successResponse(
    res,
    {
      status: latest.status,
      lastCheck: latest.timestamp,
      memory: latest.memory,
      services: latest.services
    },
    'System summary retrieved successfully'
  );
});

module.exports = exports;
