const axios = require('axios');

async function quickTest() {
  console.log('Quick API Test (No DB verification)\n');

  try {
    // Test 1: Create Event
    console.log('1️⃣  Creating event...');
    const eventData = {
      name: 'Test Event',
      date: new Date().toISOString(),
      location: 'Test Location',
      description: 'Quick test',
      expectedGuests: 50,
      organizerEmail: 'test@test.com'
    };

    const eventResponse = await axios.post('http://localhost:5000/api/events', eventData);
    const eventId = eventResponse.data.data._id;
    console.log('✅ Event created:', eventId);

    // Test 2: Register
    console.log('\n2️⃣  Creating registration...');
    const regData = {
      eventId: eventId,
      name: 'John Doe',
      email: 'john@test.com',
      phone: '+1234567890'
    };

    const regResponse = await axios.post('http://localhost:5000/api/registrations', regData);
    console.log('✅ Registration created:', regResponse.data.data.registrationId);
    console.log('   Face Processed:', regResponse.data.data.faceProcessed);

    console.log('\n✅ API is working! MongoDB must be connected in server.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

quickTest();
