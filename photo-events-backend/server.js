require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// ✨ ADD THIS - Import error handler
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// ✨ ADD THIS - Serve uploaded files as static
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

connectDB();

// Routes
app.use('/api/events', require('./connections/events'));
app.use('/api/registrations', require('./connections/registrations'));

// NEW: Face matching routes
app.use('/api/face-matching', require('./routes/faceMatching'));

// ✨ ADD THIS - Photo upload routes
app.use('/api/photos', require('./routes/photos'));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Photo Events API is running! 🚀',
    mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    endpoints: {
      events: '/api/events',
      registrations: '/api/registrations',
      // NEW: Face matching endpoint
      faceMatching: '/api/face-matching',
      // ✨ ADD THIS - Photos endpoint
      photos: '/api/photos'
    }
  });
});

// ✨ ADD THIS - Error handling middleware (must be AFTER all routes)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Test at: http://localhost:${PORT}`);
  // NEW: Face matching API message
  console.log(`📸 Face matching API available at: /api/face-matching`);
  // ✨ ADD THIS - Photos API message
  console.log(`📷 Photo upload API available at: /api/photos`);
});
// Add after existing routes
const photoRoutes = require('./routes/photos');
app.use('/api/photos', photoRoutes);
