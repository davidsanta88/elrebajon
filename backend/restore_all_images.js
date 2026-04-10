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
  const products = await Product.find({ $or: [{ images: { $size: 0 } }, { mainImage: null }] });
  console.log(`Checking ${products.length} products...`);
  
  const resources = await cloudinary.api.resources({ type: 'upload', max_results: 100 });
  const urls = resources.resources;

  for (let p of products) {
    // Try to find an image that contains the product name (search in public_id)
    const match = urls.find(u => u.public_id.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]));
    if (match) {
      p.mainImage = match.secure_url;
      p.images = [match.secure_url];
      await p.save();
      console.log(`Restored ${p.name} with ${match.secure_url}`);
    } else {
      // Fallback: use the most recent image if absolutely none match
      const fallback = urls[0];
      if (fallback) {
          p.mainImage = fallback.secure_url;
          p.images = [fallback.secure_url];
          await p.save();
          console.log(`Restored ${p.name} with FALLBACK ${fallback.secure_url}`);
      }
    }
  }
  process.exit();
}
restore();
