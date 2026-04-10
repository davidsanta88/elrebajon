const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ $or: [{ mainImage: { $exists: false } }, { mainImage: null }, { mainImage: "" }] });
  console.log(`Found ${products.length} products without mainImage`);
  
  for (let p of products) {
    if (p.images && p.images.length > 0) {
      p.mainImage = p.images[0];
      await p.save();
      console.log(`Fixed ${p.name}`);
    }
  }
  process.exit();
}
fix();
