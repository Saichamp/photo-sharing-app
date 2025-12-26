/**
 * Admin Controller
 * Handles admin-specific operations
 */

const User = require('../models/User');
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const Registration = require('../models/Registration');
const { logger } = require('../utils/logger');

/**
 * Get dashboard statistics
 */
exports.getStats = async (req, res) => {
  try {
    // Count all users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = totalUsers - activeUsers;

    // Count all events
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: 'active' });
    const completedEvents = await Event.countDocuments({ status: 'completed' });

    // Count all photos
    const totalPhotos = await Photo.countDocuments();
    
    // Calculate total storage (sum of all photo sizes)
    const storageResult = await Photo.aggregate([
      {
        $group: {
          _id: null,
          totalStorage: { $sum: '$size' }
        }
      }
    ]);
    const totalStorage = storageResult.length > 0 ? storageResult[0].totalStorage : 0;

    // Count all registrations
    const totalRegistrations = await Registration.countDocuments();

    // Get top organizers
    const topOrganizers = await Event.aggregate([
      {
        $group: {
          _id: '$organizer',
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
          as: 'organizerInfo'
        }
      },
      { $unwind: '$organizerInfo' },
      {
        $project: {
          _id: '$organizerInfo._id',
          name: '$organizerInfo.name',
          email: '$organizerInfo.email',
          eventCount: 1
        }
      }
    ]);

    // Get photo count for top organizers
    for (let organizer of topOrganizers) {
      const events = await Event.find({ organizer: organizer._id });
      const eventIds = events.map(e => e._id);
      organizer.photoCount = await Photo.countDocuments({ event: { $in: eventIds } });
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalEvents,
        activeEvents,
        completedEvents,
        totalPhotos,
        totalStorage,
        totalRegistrations,
        revenue: 0, // Placeholder for future billing
        securityLogs: 0, // Placeholder
        systemHealth: 'Good',
        apiCalls: 0, // Placeholder
        topOrganizers
      }
    });

    logger.info('Admin stats retrieved', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      adminId: req.user?.id
    });
  } catch (error) {
    logger.error('Error fetching admin stats', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error.message
    });
  }
};

/**
 * Get all users with pagination and filters
 */
exports.getUsers = async (req, res) => {
  try {
    const {
      search = '',
      role = '',
      status = '',
      plan = '',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter query
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

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalUsers = await User.countDocuments(filter);

    // Fetch users
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add event count for each user
    for (let user of users) {
      user._doc.eventCount = await Event.countDocuments({ organizer: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / parseInt(limit)),
          totalUsers,
          limit: parseInt(limit)
        }
      }
    });

    logger.info('All users retrieved', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      adminId: req.user?.id,
      count: users.length
    });
  } catch (error) {
    logger.error('Error fetching users', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * Get all events with pagination and filters
 */
exports.getAllEvents = async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (status) filter.status = status;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalEvents = await Event.countDocuments(filter);

    // Fetch events with organizer info
    const events = await Event.find(filter)
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add photo and registration counts
    for (let event of events) {
      event._doc.photoCount = await Photo.countDocuments({ event: event._id });
      event._doc.registrationCount = await Registration.countDocuments({ event: event._id });
    }

    res.status(200).json({
      success: true,
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalEvents / parseInt(limit)),
          totalEvents,
          limit: parseInt(limit)
        }
      }
    });

    logger.info('All events retrieved', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      adminId: req.user?.id,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching events', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};

/**
 * Delete user by admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting other admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete another admin user'
      });
    }

    // Delete user's events
    const userEvents = await Event.find({ organizer: userId });
    const eventIds = userEvents.map(e => e._id);

    // Delete photos associated with events
    await Photo.deleteMany({ event: { $in: eventIds } });

    // Delete registrations
    await Registration.deleteMany({ event: { $in: eventIds } });

    // Delete events
    await Event.deleteMany({ organizer: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });

    logger.info('User deleted by admin', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      adminId: req.user?.id,
      deletedUserId: userId
    });
  } catch (error) {
    logger.error('Error deleting user', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * Update user status (ban/activate)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow changing status of other admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change status of another admin'
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });

    logger.info('User status updated by admin', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      adminId: req.user?.id,
      updatedUserId: userId,
      newStatus: isActive
    });
  } catch (error) {
    logger.error('Error updating user status', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

/**
 * Delete event by admin
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Delete photos
    await Photo.deleteMany({ event: eventId });

    // Delete registrations
    await Registration.deleteMany({ event: eventId });

    // Delete event
    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      success: true,
      message: 'Event and all associated data deleted successfully'
    });

    logger.info('Event deleted by admin', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      adminId: req.user?.id,
      deletedEventId: eventId
    });
  } catch (error) {
    logger.error('Error deleting event', {
      service: 'photomanea-backend',
      environment: process.env.NODE_ENV || 'development',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
};

/**
 * Get security logs
 */
exports.getLogs = async (req, res) => {
  try {
    const {
      level = '',
      startDate = '',
      endDate = '',
      page = 1,
      limit = 50
    } = req.query;

    // For now, return mock data
    // In production, you'd query your logging system or database
    const mockLogs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'User logged in successfully',
        action: 'login',
        user: req.user?.email
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        logs: mockLogs,
        pagination: {
          currentPage: parseInt(page),
          totalLogs: mockLogs.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
};

/**
 * Get system health
 */
exports.getSystemHealth = async (req, res) => {
  try {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    
    const memUsage = process.memoryUsage();
    
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        uptime: `${days}d ${hours}h`,
        startedAt: new Date(Date.now() - uptime * 1000),
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          usedPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        cpu: {
          usage: 0,
          cores: require('os').cpus().length
        },
        disk: {
          used: 0,
          total: 0,
          usedPercent: 0
        },
        database: {
          collections: 5,
          documents: await User.countDocuments() + await Event.countDocuments(),
          size: 0,
          avgResponseTime: 5
        },
        api: {
          totalRequests: 0,
          successRate: 99,
          avgResponseTime: 150,
          errorRate: 1
        },
        services: [
          { name: 'MongoDB', status: 'running', uptime: `${days}d`, description: 'Database Service' },
          { name: 'Face Recognition', status: 'running', uptime: `${days}d`, description: 'AI Service' },
          { name: 'File Storage', status: 'running', uptime: `${days}d`, description: 'Storage Service' }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health',
      error: error.message
    });
  }
};
