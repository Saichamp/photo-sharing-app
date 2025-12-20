/**
 * Script to create initial admin user
 * Usage: node backend/scripts/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const User = require('../models/User');

async function main() {
  try {
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';

    let user = await User.findOne({ email });

    if (user) {
      console.log('Admin user already exists:', email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    user = await User.create({
      name: 'Super Admin',
      email,
      password: hash,
      role: 'admin',
      isActive: true
    });

    console.log('Admin user created:');
    console.log('Email:', email);
    console.log('Password:', password);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err);
    process.exit(1);
  }
}

main();
