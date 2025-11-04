require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Photo Events API is running! 🚀',
    mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    endpoints: {
      events: '/api/events',
      registrations: '/api/registrations',
      // NEW: Face matching endpoint
      faceMatching: '/api/face-matching'
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Test at: http://localhost:${PORT}`);
  // NEW: Face matching API message
  console.log(`📸 Face matching API available at: /api/face-matching`);
});
