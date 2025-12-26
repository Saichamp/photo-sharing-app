/**
 * Admin Controller for PhotoManEa
 * Handles admin-only operations
 */

const User = require('../models/User');
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const Registration = require('../models/Registration');
const { AppError, asyncHandler, successResponse } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform-wide statistics
 * @access  Private/Admin
 */
exports.getPlatformStats = asyncHandler(async (req, res, next) => {
  // Get counts
  const [
    totalUsers,
    activeUsers,
    totalEvents,
    activeEvents,
    totalPhotos,
    totalRegistrations
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Event.countDocuments(),
    Event.countDocuments({ status: 'active' }),
    Photo.countDocuments(),
    Registration.countDocuments()
  ]);

  // Get subscription breakdown
  const subscriptionStats = await User.aggregate([
    {
      $group: {
        _id: '$subscription.plan',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get storage usage
  const storageStats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalStorageUsed: { $sum: '$quota.storageUsed' },
        totalStorageLimit: { $sum: '$quota.storageLimit' }
      }
    }
  ]);

  // Get recent growth (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [newUsers, newEvents] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Event.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
  ]);

  // Get top organizers by events
  const topOrganizers = await Event.aggregate([
    {
      $group: {
        _id: '$userId',
        eventCount: { $sum: 1 }
      }
    },
    { $sort: { eventCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        name: '$user.name',
        email: '$user.email',
        eventCount: 1
      }
    }
  ]);

  logger.info('Platform stats retrieved', { adminId: req.user.id });

  successResponse(res, {
    overview: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalEvents,
      activeEvents,
      totalPhotos,
      totalRegistrations
    },
    subscriptions: subscriptionStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    storage: storageStats[0] || { totalStorageUsed: 0, totalStorageLimit: 0 },
    growth: {
      newUsersLast30Days: newUsers,
      newEventsLast30Days: newEvents
    },
    topOrganizers
  }, 'Platform statistics retrieved');
});

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filters
 * @access  Private/Admin
 */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    role = '',
    status = '',
    plan = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) filter.role = role;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;
  if (plan) filter['subscription.plan'] = plan;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Get users and total count
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(filter)
  ]);

  // Get event counts for each user
  const userIds = users.map(u => u._id);
  const eventCounts = await Event.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } }
  ]);

  const eventCountMap = eventCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  // Attach event counts to users
  const usersWithStats = users.map(user => ({
    ...user,
    eventCount: eventCountMap[user._id.toString()] || 0
  }));

  logger.info('Users list retrieved', { adminId: req.user.id, count: users.length });

  successResponse(res, {
    users: usersWithStats,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalUsers: total,
      limit: parseInt(limit)
    }
  }, 'Users retrieved successfully');
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get detailed user information
 * @access  Private/Admin
 */
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password').lean();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get user's events
  const events = await Event.find({ userId: user._id })
    .select('name status createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Get user's activity stats
  const [eventCount, photoCount, registrationCount] = await Promise.all([
    Event.countDocuments({ userId: user._id }),
    Photo.countDocuments({ uploadedBy: user._id }),
    Registration.countDocuments({ userId: user._id })
  ]);

  logger.info('User details retrieved', { adminId: req.user.id, targetUserId: user._id });

  successResponse(res, {
    user,
    stats: {
      totalEvents: eventCount,
      totalPhotos: photoCount,
      totalRegistrations: registrationCount
    },
    recentEvents: events
  }, 'User details retrieved');
});

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (ban/activate)
 * @access  Private/Admin
 */
exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    throw new AppError('isActive must be a boolean', 400);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user.id && !isActive) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  user.isActive = isActive;
  await user.save();

  logger.warn('User status updated', {
    adminId: req.user.id,
    targetUserId: user._id,
    newStatus: isActive ? 'active' : 'inactive'
  });

  successResponse(res, {
    id: user._id,
    email: user.email,
    isActive: user.isActive
  }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user account (hard delete)
 * @access  Private/Admin
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user.id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  // Delete user's events, photos, and registrations
  await Promise.all([
    Event.deleteMany({ userId: user._id }),
    Photo.deleteMany({ uploadedBy: user._id }),
    Registration.deleteMany({ userId: user._id })
  ]);

  await user.deleteOne();

  logger.warn('User deleted by admin', {
    adminId: req.user.id,
    deletedUserId: user._id,
    deletedUserEmail: user.email
  });

  successResponse(res, null, 'User and all associated data deleted successfully');
});

/**
 * @route   GET /api/admin/events
 * @desc    Get all events from all users
 * @access  Private/Admin
 */
exports.getAllEvents = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter
  const filter = {};

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  if (status) filter.status = status;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  // Get events with organizer info
  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Event.countDocuments(filter)
  ]);

  // Get photo and registration counts for each event
  const eventIds = events.map(e => e._id);
  const [photoCounts, registrationCounts] = await Promise.all([
    Photo.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } }
    ]),
    Registration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } }
    ])
  ]);

  const photoCountMap = photoCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  const registrationCountMap = registrationCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  // Attach counts to events
  const eventsWithStats = events.map(event => ({
    ...event,
    photoCount: photoCountMap[event._id.toString()] || 0,
    registrationCount: registrationCountMap[event._id.toString()] || 0,
    organizer: event.userId
  }));

  logger.info('All events retrieved', { adminId: req.user.id, count: events.length });

  successResponse(res, {
    events: eventsWithStats,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalEvents: total,
      limit: parseInt(limit)
    }
  }, 'Events retrieved successfully');
});

/**
 * @route   DELETE /api/admin/events/:id
 * @desc    Delete any event (admin override)
 * @access  Private/Admin
 */
exports.deleteEvent = asyncHandler(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new AppError('Event not found', 404);
  }

  // Delete associated photos and registrations
  await Promise.all([
    Photo.deleteMany({ eventId: event._id }),
    Registration.deleteMany({ eventId: event._id })
  ]);

  await event.deleteOne();

  logger.warn('Event deleted by admin', {
    adminId: req.user.id,
    eventId: event._id,
    eventName: event.name,
    organizerId: event.userId
  });

  successResponse(res, null, 'Event and all associated data deleted successfully');
});

/**
 * @route   GET /api/admin/logs
 * @desc    Get security/activity logs
 * @access  Private/Admin
 */
exports.getLogs = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    level = '',
    startDate = '',
    endDate = ''
  } = req.query;

  // This is a placeholder - you'd typically read from log files or a logging service
  // For now, return recent user activities from database

  const filter = {};

  if (startDate) {
    filter.createdAt = { $gte: new Date(startDate) };
  }

  if (endDate) {
    filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get recent logins and activities
  const recentUsers = await User.find(filter)
    .select('email lastLogin createdAt isActive')
    .sort({ lastLogin: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const logs = recentUsers.map(user => ({
    timestamp: user.lastLogin || user.createdAt,
    level: user.isActive ? 'info' : 'warn',
    action: user.lastLogin ? 'login' : 'registration',
    user: user.email,
    message: user.lastLogin ? 'User logged in' : 'New user registered'
  }));

  logger.info('Logs retrieved', { adminId: req.user.id });

  successResponse(res, {
    logs,
    pagination: {
      currentPage: parseInt(page),
      limit: parseInt(limit)
    }
  }, 'Logs retrieved successfully');
});
