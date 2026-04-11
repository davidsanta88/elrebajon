const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function checkData() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('Current __dirname:', __dirname);
      console.log('Looked for .env at:', path.join(__dirname, '..', '.env'));
      throw new Error('MONGODB_URI is not defined in .env');
    }
    
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const collections = ['orders', 'leads', 'visitors', 'products', 'categories', 'brands', 'providers', 'locations'];
    const counts = {};

    for (const colName of collections) {
      try {
        const count = await mongoose.connection.db.collection(colName).countDocuments();
        counts[colName] = count;
      } catch (e) {
        counts[colName] = 'Error: ' + e.message;
      }
    }

    console.log('--- DATABASE STATUS ---');
    console.log(JSON.stringify(counts, null, 2));

    // Get sample order product names
    try {
      const orders = await mongoose.connection.db.collection('orders').find({}).limit(5).toArray();
      if (orders.length > 0) {
        console.log('--- SAMPLE ORDERS ---');
        orders.forEach(o => {
          console.log(`- Order: ${o.customerName}, Total: ${o.totalRevenue}, Items: ${o.items?.map(i => i.name).join(', ')}`);
        });
      }
    } catch (e) {
      console.log('Order sample error:', e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
    process.exit(1);
  }
}

checkData();
