require('dotenv').config();
const path = require('path');
const faceService = require('./services/faceRecognitionService');

async function testFaceExtraction() {
  try {
    console.log('🧪 Testing face extraction...\n');
    
    // Use the actual selfie file from your error
    const testImage = 'uploads\\photos\\selfie.jpg';
    
    console.log('📸 Image:', testImage);
    console.log('📁 Full path:', path.resolve(testImage));
    console.log('');
    
    console.log('⏳ Extracting faces (this may take 1-2 minutes on first run)...\n');
    
    const result = await faceService.extractFaces(testImage);
    
    console.log('\n✅ SUCCESS!');
    console.log('Faces detected:', result.facesDetected);
    console.log('Processing time:', result.processingTime, 'seconds');
    
    if (result.faces && result.faces.length > 0) {
      console.log('\nFirst face details:');
      console.log('- Age:', result.faces[0].age);
      console.log('- Gender:', result.faces[0].gender);
      console.log('- Confidence:', (result.faces[0].confidence * 100).toFixed(2), '%');
      console.log('- Embedding length:', result.faces[0].embedding.length);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testFaceExtraction();
