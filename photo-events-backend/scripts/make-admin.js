const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/photomanea');
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      // Update existing user to admin
      existingAdmin.role = 'admin';
      existingAdmin.subscription.plan = 'enterprise';
      existingAdmin.quota.eventsLimit = 999;
      await existingAdmin.save();
      console.log('✅ Existing user updated to admin role');
    } else {
      // Create new admin
      const admin = await User.create({
        name: 'Super Admin',
        email: 'admin@example.com',
        password: 'Admin@123',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        subscription: {
          plan: 'enterprise',
          status: 'active'
        },
        quota: {
          eventsUsed: 0,
          eventsLimit: 999,
          storageUsed: 0,
          storageLimit: 107374182400
        }
      });
      console.log('✅ Admin user created successfully');
    }
    
    const admin = await User.findOne({ email: 'admin@example.com' });
    console.log('Admin details:', {
      email: admin.email,
      name: admin.name,
      role: admin.role,
      plan: admin.subscription.plan
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

createAdmin();
