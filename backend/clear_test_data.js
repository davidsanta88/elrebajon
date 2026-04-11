const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

async function clearTestData() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in .env');
    
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Collections to clear
    const collectionsToClear = ['orders', 'leads', 'visitors'];

    for (const colName of collectionsToClear) {
      console.log(`Clearing collection: ${colName}...`);
      const result = await mongoose.connection.db.collection(colName).deleteMany({});
      console.log(`Deleted ${result.deletedCount} documents from ${colName}.`);
    }

    console.log('✅ DATA CLEARING COMPLETED SUCCESSFULLY.');
    process.exit(0);
  } catch (err) {
    console.error('CRITICAL ERROR DURING CLEARING:', err);
    process.exit(1);
  }
}

clearTestData();
