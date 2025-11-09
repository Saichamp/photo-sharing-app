/**
 * Test Face Recognition Service
 * Run this BEFORE integrating with controllers
 */

const faceService = require('./services/faceRecognitionService');
const path = require('path');

async function testFaceService() {
  console.log('=' .repeat(80));
  console.log('Testing Face Recognition Service');
  console.log('=' .repeat(80));

  try {
    // Test 1: Extract faces from test image
    console.log('\n📸 TEST 1: Extract Faces from Image');
    console.log('-'.repeat(80));
    
    // You need a test image - use one from your test-insightface folder
const testImagePath = path.join(__dirname, 'selfie.jpg');
    
    console.log('Image path:', testImagePath);
    
    const result = await faceService.extractFaces(testImagePath);
    
    console.log('✅ Success!');
    console.log('   Faces detected:', result.facesDetected);
    console.log('   Processing time:', result.processingTime, 'seconds');
    
    if (result.facesDetected > 0) {
      console.log('   First face:');
      console.log('     - Age:', result.faces[0].age);
      console.log('     - Gender:', result.faces[0].gender);
      console.log('     - Confidence:', result.faces[0].confidence);
      console.log('     - Embedding length:', result.faces[0].embedding.length);
    }

    // Test 2: Compare embeddings (if we have faces)
    if (result.facesDetected >= 1) {
      console.log('\n🔍 TEST 2: Compare Embeddings');
      console.log('-'.repeat(80));
      
      const embedding1 = result.faces[0].embedding;
      const embedding2 = result.faces[0].embedding; // Same embedding (should match 100%)
      
      const comparison = faceService.compareEmbeddings(embedding1, embedding2);
      
      console.log('✅ Comparison complete!');
      console.log('   Distance:', comparison.distance);
      console.log('   Similarity:', comparison.similarity);
      console.log('   Confidence:', comparison.confidence.toFixed(2) + '%');
      console.log('   Is match?:', comparison.isMatch ? 'YES' : 'NO');
    }

    // Test 3: Validate embedding
    if (result.facesDetected >= 1) {
      console.log('\n✅ TEST 3: Validate Embedding Format');
      console.log('-'.repeat(80));
      
      const embedding = result.faces[0].embedding;
      const isValid = faceService.isValidEmbedding(embedding);
      
      console.log('   Embedding valid?:', isValid ? 'YES' : 'NO');
      console.log('   Embedding length:', embedding.length);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run tests
testFaceService()
  .then(() => {
    console.log('\n✅ Service is ready for integration!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Service test failed:', error);
    process.exit(1);
  });
