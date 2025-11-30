const mongoose = require('mongoose');
const Photo = require('../models/Photo');
const Registration = require('../models/Registration');
const config = require('../config/config');

// Connect to MongoDB
mongoose.connect(config.database.uri, config.database.options);

async function reprocessAllMatches() {
  console.log('🔄 Reprocessing face matches with threshold:', config.faceRecognition.matchThreshold);
  
  const photos = await Photo.find({ processed: true, 'faces.0': { $exists: true } });
  
  for (const photo of photos) {
    await matchPhotoWithRegistrations(photo, photo.eventId);
    console.log(`✅ Processed photo ${photo._id}: ${photo.matches?.length || 0} matches`);
  }
  
  console.log(`✅ Complete! Processed ${photos.length} photos`);
  process.exit(0);
}

// Copy the matchPhotoWithRegistrations function from photoController.js here
async function matchPhotoWithRegistrations(photo, eventId) {
  // ... (same implementation as above)
}

function calculateCosineSimilarity(embedding1, embedding2) {
  // ... (copy from photoController.js)
}

reprocessAllMatches();
