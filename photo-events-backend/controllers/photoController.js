/**
 * Photo Controller for PhotoManEa
 * Handles photo upload and management with access control
 */

const Photo = require('../models/Photo');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { AppError, asyncHandler, successResponse } = require('../middleware/errorHandler');
const { logFile, logAI, logger } = require('../utils/logger');
const faceRecognitionService = require('../services/faceRecognitionService');
const path = require('path');
const fs = require('fs').promises;

/**
 * @desc    Upload photos to an event
 * @route   POST /api/photos/upload
 * @access  Private
 */
exports.uploadPhotos = asyncHandler(async (req, res, next) => {
  const { eventId } = req.body;
  
  if (!eventId) {
    throw new AppError('Event ID is required', 400);
  }
  
  if (!req.files || req.files.length === 0) {
    throw new AppError('No photos uploaded', 400);
  }
  
  // Verify event exists and user owns it
  const event = await Event.findById(eventId);
  
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  
  if (event.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to upload photos to this event', 403);
  }
  
  // Calculate total file size
  const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
  
  // Check storage quota
  if (!req.user.hasStorageSpace(totalSize)) {
    // Delete uploaded files
    await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})));
    throw new AppError('Storage limit exceeded. Please upgrade your plan.', 403);
  }
  
  // Create photo records
  const photoPromises = req.files.map(async (file) => {
    const photo = await Photo.create({
      eventId,
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    });
    
    logFile('upload', file.filename, {
      photoId: photo._id,
      eventId,
      size: file.size
    });
    
    // Trigger background face processing
    processPhotoInBackground(photo._id, file.path);
    
    return photo;
  });
  
  const photos = await Promise.all(photoPromises);
  
  // Update event statistics
  await event.incrementPhotoStats(totalSize);
  
  // Update user storage
  await req.user.incrementStorageUsage(totalSize);
  
  logger.info('Photos uploaded', {
    userId: req.user._id,
    eventId,
    count: photos.length,
    totalSize
  });
  
  successResponse(res, {
    uploaded: photos.length,
    photos: photos.map(p => ({
      id: p._id,
      filename: p.filename,
      size: p.size
    }))
  }, 'Photos uploaded successfully', 201);
});

/**
 * @desc    Get all photos for an event
 * @route   GET /api/photos/event/:eventId
 * @access  Private or Public with registration
 */
exports.getEventPhotos = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  // Verify event exists
  const event = await Event.findById(eventId);
  
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  
  // Check access:
  // 1. Event owner (authenticated user)
  // 2. Registered guest (check registration)
  let hasAccess = false;
  
  if (req.user && event.userId.toString() === req.user._id.toString()) {
    hasAccess = true; // Event owner
  }
  
  // For guests, we'll verify registration in face-matching route
  // For now, allow public access (we'll restrict in Phase 3)
  hasAccess = true;
  
  // Get photos
  const skip = (page - 1) * limit;
  const photos = await Photo.find({ eventId, processed: true })
    .select('-faces') // Don't send face embeddings
    .sort('-uploadedAt')
    .limit(parseInt(limit))
    .skip(skip);
  
  const total = await Photo.countDocuments({ eventId, processed: true });
  
  successResponse(res, {
    photos,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  }, 'Photos retrieved successfully');
});

/**
 * @desc    Get single photo by ID
 * @route   GET /api/photos/:id
 * @access  Private or Public
 */
exports.getPhotoById = asyncHandler(async (req, res, next) => {
  const photo = await Photo.findById(req.params.id).select('-faces');
  
  if (!photo) {
    throw new AppError('Photo not found', 404);
  }
  
  // Verify access
  const event = await Event.findById(photo.eventId);
  
  if (!event) {
    throw new AppError('Associated event not found', 404);
  }
  
  // Check if user owns the event
  if (req.user && event.userId.toString() === req.user._id.toString()) {
    // Owner has full access
    successResponse(res, photo, 'Photo retrieved successfully');
  } else {
    // Public access - limited info
    successResponse(res, {
      id: photo._id,
      filename: photo.filename,
      path: photo.path,
      uploadedAt: photo.uploadedAt
    }, 'Photo retrieved successfully');
  }
});

/**
 * @desc    Delete photo
 * @route   DELETE /api/photos/:id
 * @access  Private
 */
exports.deletePhoto = asyncHandler(async (req, res, next) => {
  const photo = await Photo.findById(req.params.id);
  
  if (!photo) {
    throw new AppError('Photo not found', 404);
  }
  
  // Verify event ownership
  const event = await Event.findById(photo.eventId);
  
  if (!event) {
    throw new AppError('Associated event not found', 404);
  }
  
  if (event.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to delete this photo', 403);
  }
  
  // Delete file from disk
  try {
    await fs.unlink(photo.path);
    logFile('delete', photo.filename, { photoId: photo._id });
  } catch (error) {
    logger.error('Failed to delete photo file', { photoId: photo._id, error: error.message });
  }
  
  // Update event statistics
  event.photosUploaded = Math.max(0, event.photosUploaded - 1);
  event.storageUsed = Math.max(0, event.storageUsed - photo.size);
  await event.save();
  
  // Update user storage
  req.user.quota.storageUsed = Math.max(0, req.user.quota.storageUsed - photo.size);
  await req.user.save();
  
  // Delete photo record
  await photo.deleteOne();
  
  logger.info('Photo deleted', {
    userId: req.user._id,
    photoId: photo._id,
    eventId: event._id
  });
  
  successResponse(res, null, 'Photo deleted successfully');
});

/**
 * @desc    Manually trigger face processing
 * @route   POST /api/photos/process/:photoId
 * @access  Private
 */
exports.processPhotoFaces = asyncHandler(async (req, res, next) => {
  const photo = await Photo.findById(req.params.photoId);
  
  if (!photo) {
    throw new AppError('Photo not found', 404);
  }
  
  // Verify ownership
  const event = await Event.findById(photo.eventId);
  
  if (!event || event.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to process this photo', 403);
  }
  
  // Process faces
  try {
    const result = await faceRecognitionService.extractFaces(photo.path);
    
    if (result.success && result.facesDetected > 0) {
      photo.faces = result.faces;
      photo.processed = true;
      await photo.save();
      
      logAI('face-extraction', {
        photoId: photo._id,
        facesDetected: result.facesDetected
      });
      
      successResponse(res, {
        photoId: photo._id,
        facesDetected: result.facesDetected,
        processingTime: result.processingTime
      }, 'Photo processed successfully');
    } else {
      photo.processed = true;
      photo.processingError = 'No faces detected';
      await photo.save();
      
      successResponse(res, {
        photoId: photo._id,
        facesDetected: 0,
        message: 'No faces detected in photo'
      }, 'Photo processed (no faces found)');
    }
  } catch (error) {
    photo.processed = true;
    photo.processingError = error.message;
    await photo.save();
    
    throw new AppError('Face processing failed: ' + error.message, 500);
  }
});

/**
 * @desc    Get photo statistics for an event
 * @route   GET /api/photos/event/:eventId/stats
 * @access  Private
 */
exports.getPhotoStats = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  
  // Verify ownership
  const event = await Event.findById(eventId);
  
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  
  if (event.userId.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to view these statistics', 403);
  }
  
  // Get statistics
  const totalPhotos = await Photo.countDocuments({ eventId });
  const processedPhotos = await Photo.countDocuments({ eventId, processed: true });
  const photosWithFaces = await Photo.countDocuments({ 
    eventId, 
    processed: true,
    'faces.0': { $exists: true }
  });
  
  // Calculate total faces
  const faceAggregation = await Photo.aggregate([
    { $match: { eventId: event._id, processed: true } },
    { $project: { faceCount: { $size: { $ifNull: ['$faces', []] } } } },
    { $group: { _id: null, totalFaces: { $sum: '$faceCount' } } }
  ]);
  
  const totalFaces = faceAggregation.length > 0 ? faceAggregation[0].totalFaces : 0;
  
  const stats = {
    eventId: event._id,
    eventName: event.name,
    totalPhotos,
    processedPhotos,
    photosWithFaces,
    totalFaces,
    storageUsed: event.storageUsedMB + ' MB',
    processingProgress: totalPhotos > 0 ? Math.round((processedPhotos / totalPhotos) * 100) : 0
  };
  
  successResponse(res, stats, 'Photo statistics retrieved successfully');
});

/**
 * Background face processing function
 */
async function processPhotoInBackground(photoId, photoPath) {
  try {
    const result = await faceRecognitionService.extractFaces(photoPath);
    
    if (result.success && result.facesDetected > 0) {
      await Photo.findByIdAndUpdate(photoId, {
        faces: result.faces,
        processed: true
      });
      
      logAI('face-extraction-background', {
        photoId,
        facesDetected: result.facesDetected,
        processingTime: result.processingTime
      });
    } else {
      await Photo.findByIdAndUpdate(photoId, {
        processed: true,
        processingError: 'No faces detected'
      });
    }
  } catch (error) {
    logger.error('Background face processing failed', {
      photoId,
      error: error.message
    });
    
    await Photo.findByIdAndUpdate(photoId, {
      processed: true,
      processingError: error.message
    });
  }
}
