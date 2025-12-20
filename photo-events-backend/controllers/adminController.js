/**
 * adminController - admin user management & stats
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const AdminLog = require('../models/AdminLog');
const {
  AppError,
  asyncHandler,
  successResponse
} = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

async function getUserStats(userId) {
  const [eventCount, photoCount] = await Promise.all([
    Event.countDocuments({ userId }),
    Photo.countDocuments({ userId })
  ]);

  return { eventCount, photoCount };
}

exports.getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    role,
    status,
    plan,
    sortBy = '-createdAt'
  } = req.query;

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

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(filter)
  ]);

  const usersWithStats = await Promise.all(
    users.map(async (u) => {
      const { eventCount, photoCount } = await getUserStats(u._id);
      return {
        ...u,
        eventCount,
        photoCount
      };
    })
  );

  await AdminLog.createLog({
    adminId: req.user._id,
    action: 'USER_VIEWED',
    details: { count: users.length, filters: filter },
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  successResponse(
    res,
    {
      users: usersWithStats,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit)
      }
    },
    'Users retrieved successfully'
  );
});

exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password').lean();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const [events, photos] = await Promise.all([
    Event.find({ userId: id })
      .select('name date status photosUploaded')
      .sort('-createdAt')
      .limit(10)
      .lean(),
    Photo.find({ userId: id })
      .select('filename uploadedAt processed')
      .sort('-uploadedAt')
      .limit(10)
      .lean()
  ]);

  await AdminLog.createLog({
    adminId: req.user._id,
    action: 'USER_VIEWED',
    targetUserId: id,
    details: {},
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  successResponse(
    res,
    { user, events, photos },
    'User details retrieved successfully'
  );
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, isActive, subscription, quota } = req.body;

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const updates = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (role) updates.role = role;
  if (typeof isActive === 'boolean') updates.isActive = isActive;
  if (subscription) {
    updates.subscription = { ...user.subscription, ...subscription };
  }
  if (quota) {
    updates.quota = { ...user.quota, ...quota };
  }

  Object.assign(user, updates);
  await user.save();

  await AdminLog.createLog({
    adminId: req.user._id,
    action: 'USER_UPDATED',
    targetUserId: id,
    details: updates,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  logger.info('Admin updated user', {
    adminId: req.user._id,
    userId: id,
    updates: Object.keys(updates)
  });

  const safeUser = user.toObject();
  delete safeUser.password;

  successResponse(res, safeUser, 'User updated successfully');
});

exports.resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  await AdminLog.createLog({
    adminId: req.user._id,
    action: 'PASSWORD_RESET',
    targetUserId: id,
    details: { email: user.email },
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  });

  logger.warn('Admin reset user password', {
    adminId: req.user._id,
    userId: id,
    email: user.email
  });

  successResponse(res, null, 'Password reset successfully');
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isActive = !user.isActive;
  await user.save();

  await AdminLog.createLog({
    adminId: req.user._id,
    action: user.isActive ? 'USER_ENABLED' : 'USER_DISABLED',
    targetUserId: id,
    details: { email: user.email, isActive: user.isActive },
    ipAddress: req.ip
  });

  logger.info('Admin toggled user status', {
    adminId: req.user._id,
    userId: id,
    isActive: user.isActive
  });

  successResponse(
    res,
    { isActive: user.isActive },
    `User ${user.isActive ? 'enabled' : 'disabled'} successfully`
  );
});

exports.updateSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { plan, status, expiresAt } = req.body;

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (plan) user.subscription.plan = plan;
  if (status) user.subscription.status = status;
  if (expiresAt) user.subscription.expiresAt = new Date(expiresAt);

  const quotaMap = {
    free: { eventsLimit: 3, storageLimit: 1 * 1024 * 1024 * 1024 },
    pro: { eventsLimit: 20, storageLimit: 10 * 1024 * 1024 * 1024 },
    enterprise: { eventsLimit: -1, storageLimit: 100 * 1024 * 1024 * 1024 }
  };

  if (plan && quotaMap[plan]) {
    user.quota = { ...user.quota, ...quotaMap[plan] };
  }

  await user.save();

  await AdminLog.createLog({
    adminId: req.user._id,
    action: 'SUBSCRIPTION_UPDATED',
    targetUserId: id,
    details: { plan, status, expiresAt },
    ipAddress: req.ip
  });

  logger.info('Admin updated subscription', {
    adminId: req.user._id,
    userId: id,
    plan
  });

  successResponse(res, user.subscription, 'Subscription updated successfully');
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isActive = false;
  user.deletedAt = new Date();
  await user.save();

  await AdminLog.createLog({
    adminId: req.user._id,
    action: 'USER_DELETED',
    targetUserId: id,
    details: { email: user.email },
    ipAddress: req.ip
  });

  logger.warn('Admin deleted user', {
    adminId: req.user._id,
    userId: id,
    email: user.email
  });

  successResponse(res, null, 'User deleted successfully');
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalEvents,
    totalPhotos,
    processingPhotos,
    failedPhotos,
    subscriptionStats
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Event.countDocuments(),
    Photo.countDocuments(),
    Photo.countDocuments({ processed: false }),
    Photo.countDocuments({ processingError: { $ne: null } }),
    User.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  successResponse(
    res,
    {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      events: {
        total: totalEvents
      },
      photos: {
        total: totalPhotos,
        processing: processingPhotos,
        failed: failedPhotos
      },
      subscriptions: subscriptionStats
    },
    'Dashboard stats retrieved successfully'
  );
});

module.exports = exports;
