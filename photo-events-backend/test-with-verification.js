/**
 * Comprehensive Test with MongoDB Verification
 * Tests each step and verifies data in database
 */

const axios = require('axios');
const mongoose = require('mongoose');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/photo-events';

// Test state
let testEventId = null;
let testRegistrationId = null;

// MongoDB models (for verification)
const EventSchema = new mongoose.Schema({}, { strict: false });
const RegistrationSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.model('Event', EventSchema);
const Registration = mongoose.model('Registration', RegistrationSchema);

async function connectToDatabase() {
  console.log('🔌 Connecting to MongoDB for verification...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function verifyInDatabase(collectionName, id, description) {
  console.log(`\n🔍 Verifying ${description} in database...`);
  
  try {
    let doc;
    if (collectionName === 'events') {
      doc = await Event.findById(id);
    } else if (collectionName === 'registrations') {
      doc = await Registration.findById(id);
    }
    
    if (doc) {
      console.log(`✅ VERIFIED: ${description} exists in MongoDB`);
      console.log(`   Document ID: ${doc._id}`);
      console.log(`   Created: ${doc.createdAt || doc.registeredAt || 'N/A'}`);
      return doc;
    } else {
      console.log(`❌ FAILED: ${description} NOT found in MongoDB!`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Database verification error:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('=' .repeat(80));
  console.log('COMPREHENSIVE TEST - API + MongoDB Verification');
  console.log('=' .repeat(80));
  console.log();

  try {
    // Connect to MongoDB for verification
    await connectToDatabase();

    // ========================================================================
    // TEST 1: Create Event
    // ========================================================================
    console.log('─'.repeat(80));
    console.log('TEST 1: Create Event');
    console.log('─'.repeat(80));

    const eventData = {
      name: 'Face Recognition Test Event',
      date: new Date().toISOString(),
      location: 'Virtual Test Location',
      description: 'Testing face recognition with MongoDB verification',
      expectedGuests: 100,
      organizerEmail: 'organizer@test.com'
    };

    console.log('\n📤 Sending POST request to /api/events...');
    console.log('   Data:', JSON.stringify(eventData, null, 2));

    const eventResponse = await axios.post(`${BASE_URL}/api/events`, eventData);
    
    console.log('\n✅ API Response received:');
    console.log('   Status:', eventResponse.status);
    console.log('   Success:', eventResponse.data.success);
    console.log('   Message:', eventResponse.data.message);
    
    testEventId = eventResponse.data.data._id;
    console.log('   Event ID:', testEventId);
    console.log('   Event Name:', eventResponse.data.data.name);
    console.log('   QR Code:', eventResponse.data.data.qrCode);

    // Verify in database
    const eventDoc = await verifyInDatabase('events', testEventId, 'Event');
    
    if (!eventDoc) {
      throw new Error('Event not found in database!');
    }

    console.log('\n📊 Event Document in MongoDB:');
    console.log('   Name:', eventDoc.name);
    console.log('   Location:', eventDoc.location);
    console.log('   Expected Guests:', eventDoc.expectedGuests);
    console.log('   Organizer Email:', eventDoc.organizerEmail);
    console.log('   Status:', eventDoc.status);

    // ========================================================================
    // TEST 2: Register WITHOUT Selfie
    // ========================================================================
    console.log('\n' + '─'.repeat(80));
    console.log('TEST 2: Registration WITHOUT Face Detection');
    console.log('─'.repeat(80));

    const regData = {
      eventId: testEventId,
      name: 'John Doe',
      email: 'john@test.com',
      phone: '+1234567890'
    };

    console.log('\n📤 Sending POST request to /api/registrations...');
    console.log('   Data:', JSON.stringify(regData, null, 2));

    const regResponse = await axios.post(`${BASE_URL}/api/registrations`, regData);
    
    console.log('\n✅ API Response received:');
    console.log('   Status:', regResponse.status);
    console.log('   Success:', regResponse.data.success);
    console.log('   Message:', regResponse.data.message);
    
    testRegistrationId = regResponse.data.data.registrationId;
    console.log('   Registration ID:', testRegistrationId);
    console.log('   Name:', regResponse.data.data.name);
    console.log('   Email:', regResponse.data.data.email);
    console.log('   Face Processed:', regResponse.data.data.faceProcessed);
    console.log('   QR Code Generated:', !!regResponse.data.data.qrCode);

    // Verify in database
    const regDoc = await verifyInDatabase('registrations', testRegistrationId, 'Registration');
    
    if (!regDoc) {
      throw new Error('Registration not found in database!');
    }

    console.log('\n📊 Registration Document in MongoDB:');
    console.log('   Name:', regDoc.name);
    console.log('   Email:', regDoc.email);
    console.log('   Phone:', regDoc.phone);
    console.log('   Event ID:', regDoc.eventId);
    console.log('   Face Processed:', regDoc.faceProcessed);
    console.log('   Selfie URL:', regDoc.selfieUrl || 'N/A');
    console.log('   Has Embedding:', regDoc.faceEmbedding ? 'Yes' : 'No');
    
    if (regDoc.faceEmbedding) {
      console.log('   Embedding Length:', regDoc.faceEmbedding.length);
    }

    // ========================================================================
    // TEST 3: Register WITH Selfie (if test image exists)
    // ========================================================================
    const testImagePath = path.join(__dirname, 'test-face.jpg');
    
    if (fs.existsSync(testImagePath)) {
      console.log('\n' + '─'.repeat(80));
      console.log('TEST 3: Registration WITH Face Detection');
      console.log('─'.repeat(80));

      const form = new FormData();
      form.append('eventId', testEventId);
      form.append('name', 'Jane Smith');
      form.append('email', 'jane@test.com');
      form.append('phone', '+9876543210');
      form.append('selfie', fs.createReadStream(testImagePath));

      console.log('\n📤 Sending POST request with selfie...');
      console.log('   Including file: test-face.jpg');

      const regWithFaceResponse = await axios.post(
        `${BASE_URL}/api/registrations`,
        form,
        { headers: form.getHeaders() }
      );
      
      console.log('\n✅ API Response received:');
      console.log('   Status:', regWithFaceResponse.status);
      console.log('   Success:', regWithFaceResponse.data.success);
      
      const regWithFaceId = regWithFaceResponse.data.data.registrationId;
      console.log('   Registration ID:', regWithFaceId);
      console.log('   Name:', regWithFaceResponse.data.data.name);
      console.log('   Face Processed:', regWithFaceResponse.data.data.faceProcessed);
      console.log('   Selfie URL:', regWithFaceResponse.data.data.selfieUrl);

      // Verify in database
      const regWithFaceDoc = await verifyInDatabase('registrations', regWithFaceId, 'Registration with Face');
      
      if (!regWithFaceDoc) {
        throw new Error('Registration with face not found in database!');
      }

      console.log('\n📊 Registration with Face Document in MongoDB:');
      console.log('   Name:', regWithFaceDoc.name);
      console.log('   Email:', regWithFaceDoc.email);
      console.log('   Face Processed:', regWithFaceDoc.faceProcessed);
      console.log('   Selfie URL:', regWithFaceDoc.selfieUrl);
      console.log('   Has Embedding:', regWithFaceDoc.faceEmbedding ? 'Yes ✅' : 'No ❌');
      
      if (regWithFaceDoc.faceEmbedding) {
        console.log('   Embedding Length:', regWithFaceDoc.faceEmbedding.length);
        console.log('   First 5 values:', regWithFaceDoc.faceEmbedding.slice(0, 5));
      }

      // Check if selfie file exists
      if (regWithFaceDoc.selfieUrl) {
        const selfieFilePath = path.join(__dirname, regWithFaceDoc.selfieUrl);
        const fileExists = fs.existsSync(selfieFilePath);
        console.log('   Selfie file exists:', fileExists ? 'Yes ✅' : 'No ❌');
      }
    } else {
      console.log('\n⚠️  TEST 3 SKIPPED: test-face.jpg not found');
      console.log('   To test face detection, add test-face.jpg to backend folder');
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(80));
    
    console.log('\n📊 Summary:');
    console.log('   ✅ Event created and verified in MongoDB');
    console.log('   ✅ Registration without face verified in MongoDB');
    if (fs.existsSync(testImagePath)) {
      console.log('   ✅ Registration with face verified in MongoDB');
    }
    
    console.log('\n📝 MongoDB Collections:');
    const eventCount = await Event.countDocuments();
    const regCount = await Registration.countDocuments();
    console.log('   Events:', eventCount);
    console.log('   Registrations:', regCount);

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error('\nError:', error.message);
    
    if (error.response) {
      console.error('\nAPI Response:');
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code) {
      console.error('\nError Code:', error.code);
    }
    
    process.exit(1);
  } finally {
    // Cleanup
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('\n✅ Comprehensive test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
