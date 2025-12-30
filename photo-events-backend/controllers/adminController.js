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

    // Get top organizers (using userId field)
    const topOrganizers = await Event.aggregate([
      {
        $group: {
          _id: '$userId',  // ✅ Changed from '$organizer' to '$userId'
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
      const events = await Event.find({ userId: organizer._id });  // ✅ Changed to userId
      const eventIds = events.map(e => e._id);
      organizer.photoCount = await Photo.countDocuments({ eventId: { $in: eventIds } });  // ✅ Changed to eventId
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
        revenue: 0,
        securityLogs: 0,
        systemHealth: 'Good',
        apiCalls: 0,
        topOrganizers
      }
    });

    logger.info('Admin stats retrieved', {
      service: 'photomanea-backend',
      adminId: req.user?._id
    });
  } catch (error) {
    logger.error('Error fetching admin stats', {
      service: 'photomanea-backend',
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
      user._doc.eventCount = await Event.countDocuments({ userId: user._id });  // ✅ Changed to userId
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
      adminId: req.user?._id,
      count: users.length
    });
  } catch (error) {
    logger.error('Error fetching users', {
      service: 'photomanea-backend',
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

    console.log('📊 Admin getAllEvents called:', { search, status, page, limit });

    // Build filter query
    const filter = {};
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (status) filter.status = status;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalEvents = await Event.countDocuments(filter);

    console.log(`📈 Total events found: ${totalEvents}`);

    // ✅ FIXED: Use 'userId' instead of 'organizer'
    const events = await Event.find(filter)
      .populate('userId', 'name email')  // ✅ Changed from 'organizer' to 'userId'
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`✅ Events fetched: ${events.length}`);

    // Add photo and registration counts
    for (let event of events) {
      event._doc.photoCount = await Photo.countDocuments({ eventId: event._id });  // ✅ Changed to eventId
      event._doc.registrationCount = await Registration.countDocuments({ eventId: event._id });  // ✅ Changed to eventId
      
      // ✅ Add organizer info (rename userId to organizer for frontend)
      if (event.userId) {
        event._doc.organizer = {
          _id: event.userId._id,
          name: event.userId.name,
          email: event.userId.email
        };
      }
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
      adminId: req.user?._id,
      count: events.length
    });
  } catch (error) {
    console.error('❌ Error in getAllEvents:', error);
    logger.error('Error fetching events', {
      service: 'photomanea-backend',
      error: error.message,
      stack: error.stack
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

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete another admin user'
      });
    }

    // ✅ Delete user's events (using userId)
    const userEvents = await Event.find({ userId: userId });
    const eventIds = userEvents.map(e => e._id);

    // Delete photos (using eventId)
    await Photo.deleteMany({ eventId: { $in: eventIds } });

    // Delete registrations (using eventId)
    await Registration.deleteMany({ eventId: { $in: eventIds } });

    // Delete events
    await Event.deleteMany({ userId: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });

    logger.info('User deleted by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      deletedUserId: userId
    });
  } catch (error) {
    logger.error('Error deleting user', {
      service: 'photomanea-backend',
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
      adminId: req.user?._id,
      updatedUserId: userId,
      newStatus: isActive
    });
  } catch (error) {
    logger.error('Error updating user status', {
      service: 'photomanea-backend',
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

    // ✅ Delete photos (using eventId)
    await Photo.deleteMany({ eventId: eventId });

    // ✅ Delete registrations (using eventId)
    await Registration.deleteMany({ eventId: eventId });

    // Delete event
    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      success: true,
      message: 'Event and all associated data deleted successfully'
    });

    logger.info('Event deleted by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      deletedEventId: eventId
    });
  } catch (error) {
    logger.error('Error deleting event', {
      service: 'photomanea-backend',
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
/**
 * Update user details (admin only)
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });

    logger.info('User updated by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      updatedUserId: userId
    });
  } catch (error) {
    logger.error('Error updating user', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * Reset user password (admin only)
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Update user password
    user.password = tempPassword;
    await user.save();

    // TODO: Send email to user with temp password
    // For now, return it in response (NOT SECURE for production!)
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        tempPassword, // Remove this in production!
        message: 'Temporary password generated. User should change it on next login.'
      }
    });

    logger.info('Password reset by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      resetUserId: userId
    });
  } catch (error) {
    logger.error('Error resetting password', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};
/**
 * Update user details (admin only)
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });

    logger.info('User updated by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      updatedUserId: userId
    });
  } catch (error) {
    logger.error('Error updating user', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * Reset user password (admin only)
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Update user password
    user.password = tempPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        tempPassword,
        message: 'Temporary password generated. User should change it on next login.'
      }
    });

    logger.info('Password reset by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      resetUserId: userId
    });
  } catch (error) {
    logger.error('Error resetting password', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};
/**
 * Get all events (admin)
 */
/**
 * Get all events (admin) - UPDATED VERSION
 */
exports.getAllEvents = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    // Get events with pagination (WITHOUT populate first to avoid errors)
    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Manually get counts and organizer info
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ 
          eventId: event._id  // or event: event._id, check your Registration model
        });
        
        const photoCount = await Photo.countDocuments({ 
          eventId: event._id 
        });
        
        // Try to get organizer (handle different field names)
        let organizer = null;
        const organizerId = event.organizer || event.userId || event.creator || event.user;
        
        if (organizerId) {
          organizer = await User.findById(organizerId).select('name email').lean();
        }
        
        return {
          ...event,
          organizer: organizer || { name: 'Unknown', email: 'N/A' },
          registrationCount,
          photoCount
        };
      })
    );

    const total = await Event.countDocuments(query);

    // Get stats
    const stats = {
      active: await Event.countDocuments({ status: 'active' }),
      completed: await Event.countDocuments({ status: 'completed' }),
      cancelled: await Event.countDocuments({ status: 'cancelled' })
    };

    res.status(200).json({
      success: true,
      data: {
        events: eventsWithCounts,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalEvents: total,
          limit: Number(limit)
        },
        stats
      }
    });

    logger.info('All events retrieved', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      count: events.length
    });
  } catch (error) {
    logger.error('Error fetching all events', {
      service: 'photomanea-backend',
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};


/**
 * Update event (admin)
 */
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, description, location, date, status } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Update fields
    if (name) event.name = name;
    if (description) event.description = description;
    if (location) event.location = location;
    if (date) event.date = date;
    if (status) event.status = status;

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
    });

    logger.info('Event updated by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      eventId
    });
  } catch (error) {
    logger.error('Error updating event', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
};

/**
 * Delete event (admin)
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

    // Delete all related data
    await Registration.deleteMany({ event: eventId });
    await Photo.deleteMany({ event: eventId });
    
    // Delete event
    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      success: true,
      message: 'Event and all related data deleted successfully'
    });

    logger.info('Event deleted by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      eventId
    });
  } catch (error) {
    logger.error('Error deleting event', {
      service: 'photomanea-backend',
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
 * Get all photos (admin)
 */
/**
 * Get all photos (admin) - FIXED FOR YOUR SCHEMA
 */
exports.getAllPhotos = async (req, res) => {
  try {
    const { search, event, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    
    if (event) {
      query.eventId = event;  // ✅ Changed from 'event' to 'eventId'
    }

    // If search, find events matching search and use their IDs
    if (search) {
      const matchingEvents = await Event.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      if (matchingEvents.length > 0) {
        query.eventId = { $in: matchingEvents.map(e => e._id) };  // ✅ Changed to 'eventId'
      }
    }

    // Get photos with pagination
    const photos = await Photo.find(query)
      .populate('eventId', 'name location date')  // ✅ Changed from 'event' to 'eventId'
      .populate('userId', 'name email')  // ✅ Changed from 'uploadedBy' to 'userId'
      .sort({ uploadedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

// Map to frontend-friendly format
const photosFormatted = photos.map(photo => ({
  _id: photo._id,
  filename: photo.filename,
  url: photo.url || photo.path,  // ✅ Use url or path
  path: photo.path,  // Keep path for reference
  size: photo.size,
  event: photo.eventId,
  uploadedBy: photo.userId,
  facesDetected: photo.faces?.length || 0,
  faces: photo.faces || [],
  uploadedAt: photo.uploadedAt,
  processedAt: photo.processed ? photo.updatedAt : null
}));


    const total = await Photo.countDocuments(query);

    // Get stats
    const stats = {
      total: await Photo.countDocuments(),
      withFaces: await Photo.countDocuments({ 'faces.0': { $exists: true } }),
      withoutFaces: await Photo.countDocuments({ 'faces.0': { $exists: false } }),
      totalSize: await Photo.aggregate([
        { $group: { _id: null, total: { $sum: '$size' } } }
      ]).then(result => result[0]?.total || 0)
    };

    res.status(200).json({
      success: true,
      data: {
        photos: photosFormatted,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalPhotos: total,
          limit: Number(limit)
        },
        stats
      }
    });

    logger.info('All photos retrieved', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      count: photos.length
    });
  } catch (error) {
    logger.error('Error fetching all photos', {
      service: 'photomanea-backend',
      error: error.message,
      stack: error.stack  // ✅ Added for debugging
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch photos',
      error: error.message
    });
  }
};

/**
 * Delete photo (admin) - FIXED FOR YOUR SCHEMA
 */
exports.deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Delete physical file
    const fs = require('fs');
    const path = require('path');
    
    // Use photo.path instead of photo.url
    const filePath = path.join(__dirname, '..', photo.path);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('Physical file deleted', { filePath });
    }

    // Delete from database
    await Photo.findByIdAndDelete(photoId);

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully'
    });

    logger.info('Photo deleted by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      photoId
    });
  } catch (error) {
    logger.error('Error deleting photo', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete photo',
      error: error.message
    });
  }
};

/**
 * Bulk delete photos (admin) - FIXED FOR YOUR SCHEMA
 */
exports.bulkDeletePhotos = async (req, res) => {
  try {
    const { photoIds } = req.body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide photo IDs to delete'
      });
    }

    const photos = await Photo.find({ _id: { $in: photoIds } });

    // Delete physical files
    const fs = require('fs');
    const path = require('path');
    
    let deletedFiles = 0;
    for (const photo of photos) {
      const filePath = path.join(__dirname, '..', photo.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedFiles++;
      }
    }

    // Delete from database
    const result = await Photo.deleteMany({ _id: { $in: photoIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} photo(s) deleted successfully`,
      data: {
        deletedFromDB: result.deletedCount,
        deletedFiles: deletedFiles
      }
    });

    logger.info('Bulk photos deleted by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      count: result.deletedCount,
      filesDeleted: deletedFiles
    });
  } catch (error) {
    logger.error('Error bulk deleting photos', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete photos',
      error: error.message
    });
  }
};


/**
 * Delete photo (admin)
 */
exports.deletePhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Delete physical file
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', photo.url);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await Photo.findByIdAndDelete(photoId);

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully'
    });

    logger.info('Photo deleted by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      photoId
    });
  } catch (error) {
    logger.error('Error deleting photo', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete photo',
      error: error.message
    });
  }
};

/**
 * Bulk delete photos (admin)
 */
exports.bulkDeletePhotos = async (req, res) => {
  try {
    const { photoIds } = req.body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide photo IDs to delete'
      });
    }

    const photos = await Photo.find({ _id: { $in: photoIds } });

    // Delete physical files
    const fs = require('fs');
    const path = require('path');
    
    for (const photo of photos) {
      const filePath = path.join(__dirname, '..', photo.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from database
    await Photo.deleteMany({ _id: { $in: photoIds } });

    res.status(200).json({
      success: true,
      message: `${photos.length} photo(s) deleted successfully`
    });

    logger.info('Bulk photos deleted by admin', {
      service: 'photomanea-backend',
      adminId: req.user?._id,
      count: photos.length
    });
  } catch (error) {
    logger.error('Error bulk deleting photos', {
      service: 'photomanea-backend',
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete photos',
      error: error.message
    });
  }
};
