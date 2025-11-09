const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testRegistration() {
  console.log('Testing Registration (simplified)...\n');

  try {
    // First, get or create an event
    console.log('1️⃣  Getting existing events...');
    let eventId;
    
    try {
      const eventsResponse = await axios.get('http://localhost:5000/api/events');
      const events = eventsResponse.data.data;
      
      if (events && events.length > 0) {
        eventId = events[0]._id;
        console.log('✅ Using existing event:', eventId);
      }
    } catch (e) {
      console.log('⚠️  No existing events, will create one');
    }

    // Create event if none exists
    if (!eventId) {
      console.log('\n2️⃣  Creating test event...');
      const eventData = {
        name: 'Face Recognition Test Event',
        date: new Date().toISOString(),
        location: 'Virtual',
        description: 'Testing face recognition integration',
        expectedGuests: 50,  // ✅ ADDED
        organizerEmail: 'organizer@example.com'  // ✅ ADDED
      };

      const eventResponse = await axios.post(
        'http://localhost:5000/api/events',
        eventData
      );
      
      eventId = eventResponse.data.data._id;
      console.log('✅ Event created:', eventId);
    }

    // Test registration WITHOUT selfie first
    console.log('\n3️⃣  Testing registration WITHOUT face detection...');
    
    const simpleReg = await axios.post('http://localhost:5000/api/registrations', {
      eventId: eventId,
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890'
    });

    console.log('✅ Basic registration works!');
    console.log('   Registration ID:', simpleReg.data.data.registrationId);
    console.log('   Name:', simpleReg.data.data.name);
    console.log('   Face Processed:', simpleReg.data.data.faceProcessed || false);

    console.log('\n✅ Test complete! Server and basic API working.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code) {
      console.error('   Code:', error.code);
    }
  }
}

testRegistration();
