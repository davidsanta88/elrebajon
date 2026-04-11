const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

async function clearData() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // We clear transactional/test data
    // We KEEP catalog data (Products, Categories, Brands, Providers, Locations)
    // unless explicitly told to wipe everything.
    
    const collectionsToClear = ['orders', 'leads', 'visitors'];
    
    for (const colName of collectionsToClear) {
      console.log(`Clearing collection: ${colName}...`);
      await mongoose.connection.db.collection(colName).deleteMany({});
      console.log(`Collection ${colName} cleared.`);
    }

    console.log('✅ Success: Test data cleared successfully.');
    process.exit(0);
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
    process.exit(1);
  }
}

clearData();
