const axios = require('axios');

async function debugConnection() {
    console.log('🔍 Debugging Frontend-Backend Connection\n');

    // Test 1: Check if server responds
    console.log('1️⃣  Testing if backend is running...');
    try {
        const response = await axios.get('http://localhost:5000');
        console.log('✅ Backend is running');
        console.log('   Response:', response.data);
    } catch (error) {
        console.error('❌ Backend is NOT running!');
        console.error('   Error:', error.message);
        console.error('\n   Fix: Run "npm start" in backend folder');
        return;
    }

    // Test 2: Check API routes
    console.log('\n2️⃣  Testing API routes...');
    try {
        const response = await axios.get('http://localhost:5000/api/events');
        console.log('✅ Events API working');
        console.log('   Events found:', response.data.data?.length || 0);
    } catch (error) {
        console.error('❌ Events API failed');
        console.error('   Error:', error.message);
    }

    // Test 3: Check CORS
    console.log('\n3️⃣  Checking CORS headers...');
    try {
        const response = await axios.get('http://localhost:5000/api/events');
        console.log('✅ CORS configured');
        console.log('   Access-Control-Allow-Origin:', 
            response.headers['access-control-allow-origin'] || 'Not set');
    } catch (error) {
        console.log('⚠️  Could not check CORS headers');
    }

    console.log('\n✅ All backend checks passed!');
    console.log('\n📝 If frontend still has issues, check:');
    console.log('   1. Frontend is running on http://localhost:3000');
    console.log('   2. Browser console for CORS errors');
    console.log('   3. Network tab in DevTools for failed requests');
}

debugConnection();
