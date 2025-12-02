require('dotenv').config();
const mongoose = require('mongoose');

async function fixQRCodeIssue() {
  try {
    console.log('🔧 Fixing qrCode unique constraint issue...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const registrations = db.collection('registrations');
    
    // Show current indexes
    console.log('📋 Current indexes:');
    const indexes = await registrations.indexes();
    indexes.forEach(index => {
      console.log(`   - ${index.name}:`, JSON.stringify(index.key));
    });
    
    // Drop the problematic qrCode index
    try {
      await registrations.dropIndex('qrCode_1');
      console.log('\n✅ Successfully dropped qrCode_1 index!');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('\n⚠️  qrCode_1 index not found (may already be dropped)');
      } else {
        throw error;
      }
    }
    
    // Optional: Remove qrCode field from existing documents
    console.log('\n🧹 Removing qrCode field from existing registrations...');
    const result = await registrations.updateMany(
      {},
      { $unset: { qrCode: "" } }
    );
    console.log(`✅ Updated ${result.modifiedCount} document(s)`);
    
    // Create compound unique index
    console.log('\n📝 Creating compound unique index (eventId + email)...');
    await registrations.createIndex(
      { eventId: 1, email: 1 },
      { unique: true, name: 'eventId_email_unique' }
    );
    console.log('✅ Compound index created!');
    
    console.log('\n🎉 All done! Your registration should work now.');
    console.log('👉 Restart your server and try again.\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixQRCodeIssue();
