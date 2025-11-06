const Photo = require('../models/Photo');
const path = require('path');
const fs = require('fs').promises;

// Upload multiple photos for an event
const uploadPhotos = async (req, res) => {
  try {
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos uploaded' });
    }

    console.log(`📸 Uploading ${req.files.length} photos for event ${eventId}`);

    // Create Photo documents for each uploaded file
    const photoDocuments = req.files.map(file => ({
      eventId: eventId,
      filename: file.filename,
      originalName: file.originalname,
      imageUrl: `/uploads/photos/${file.filename}`,
      status: 'uploaded'
    }));

    const savedPhotos = await Photo.insertMany(photoDocuments);

    console.log(`✅ ${savedPhotos.length} photos saved to database`);

    // TODO: Trigger face detection processing (will implement later)
    // processPhotosInBackground(savedPhotos);

    res.status(201).json({
      message: 'Photos uploaded successfully',
      count: savedPhotos.length,
      photos: savedPhotos
    });

  } catch (error) {
    console.error('❌ Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
};

// Get all photos for an event
const getEventPhotos = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const photos = await Photo.find({ eventId })
      .sort({ uploadedAt: -1 });

    res.json({
      count: photos.length,
      photos
    });

  } catch (error) {
    console.error('❌ Get photos error:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
};

module.exports = {
  uploadPhotos,
  getEventPhotos
};
