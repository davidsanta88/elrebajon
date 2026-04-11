const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function dumpProducts() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    
    console.log('--- PRODUCT DUMP ---');
    products.forEach(p => {
      console.log(`- ID: ${p._id}, Name: ${p.name}, Category: ${p.category}, isOffer: ${p.isOffer}, status: ${p.status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
}

dumpProducts();
