const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await mongoose.connection.db.collection('products').find().limit(5).toArray();
  console.log(JSON.stringify(products, null, 2));
  process.exit();
}
check();
