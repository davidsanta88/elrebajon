require('dotenv').config();
const mongoose = require('mongoose');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const collections = ['orders', 'leads', 'visitors', 'products', 'categories', 'brands', 'providers', 'locations'];
    const counts = {};

    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col).countDocuments();
      counts[col] = count;
    }

    console.log('--- DATABASE STATUS ---');
    console.log(JSON.stringify(counts, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkData();
