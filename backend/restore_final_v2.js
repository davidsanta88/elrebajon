const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: './backend/.env' });
const Product = require('./models/Product');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function restore() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // 1. Restore isOffer status (Case-Insensitive)
  const names = [/chanchito/i, /estufa/i, /colchon/i];
  const res = await Product.updateMany({ name: { $in: names } }, { isOffer: false });
  console.log(`Updated products to isOffer: false`);

  // 2. Fetch images from Cloudinary
  const resources = await cloudinary.api.resources({ type: 'upload', max_results: 100 });
  const urls = resources.resources;

  const products = await Product.find({ name: { $in: names } });
  
  for (let p of products) {
      // Find matching image by name
      const found = urls.find(r => r.public_id.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]));
      // Fallback: If no direct match, look for anything that isn't the 'girl in black' image if possible, or just the most recent one that isn't already used
      if (found) {
          p.mainImage = found.secure_url;
          p.images = [found.secure_url];
          await p.save();
          console.log(`Restored ${p.name} with: ${found.secure_url}`);
      }
  }

  process.exit();
}
restore();
