const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/Product');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function restore() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // 1. Reset isOffer for suspected products
  await Product.updateMany({ name: { $in: [/chanchito/i, /estufa/i, /colchon/i] } }, { isOffer: false });
  console.log("Reset isOffer for products");

  // 2. Fetch resources and log them to find the correct ones
  const resources = await cloudinary.api.resources({ type: 'upload', max_results: 100 });
  const urls = resources.resources;

  const mapping = {
    "/chanchito/i": urls.find(r => r.public_id.toLowerCase().includes('chanchito') || r.public_id.toLowerCase().includes('piggy')),
    "/estufa/i": urls.find(r => r.public_id.toLowerCase().includes('estufa') || r.public_id.toLowerCase().includes('stove')),
    "/colchon/i": urls.find(r => r.public_id.toLowerCase().includes('colchon') || r.public_id.toLowerCase().includes('mattress'))
  };

  for (let [pattern, resource] of Object.entries(mapping)) {
    if (resource) {
      const regex = new RegExp(pattern.slice(1, -2), 'i');
      await Product.updateMany({ name: regex }, { mainImage: resource.secure_url, images: [resource.secure_url] });
      console.log(`Restored ${pattern} with ${resource.secure_url}`);
    }
  }

  process.exit();
}
restore();
