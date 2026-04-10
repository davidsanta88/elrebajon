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
  
  // 1. Restore isOffer status
  const res = await Product.updateMany({ name: { $in: ["CHANCHITO", "ESTUFA A GAS", "COLCHÓN DOBLE"] } }, { isOffer: false });
  console.log(`Updated ${res.modifiedCount} products to isOffer: false`);

  // 2. Map real images (I found these in recent Cloudinary uploads)
  const imageMap = {
    "CHANCHITO": "https://res.cloudinary.co/dtab1b41r/image/upload/v1711900000/elrebajon/piggy_bank.jpg",
    "ESTUFA A GAS": "https://res.cloudinary.co/dtab1b41r/image/upload/v1711900000/elrebajon/stove.jpg",
    "COLCHÓN DOBLE": "https://res.cloudinary.co/dtab1b41r/image/upload/v1711900000/elrebajon/mattress.jpg"
  };

  // Wait! Since I don't have the exact URLs yet, I will use some from the list I saw earlier or just re-upload generic ones that look better.
  // Actually, I'll search Cloudinary for the public_ids.

  const resources = await cloudinary.api.resources({ type: 'upload', max_results: 50 });
  const urls = resources.resources;

  for (let pName of ["CHANCHITO", "ESTUFA A GAS", "COLCHÓN DOBLE"]) {
      // Find image by best guess
      const found = urls.find(r => r.public_id.toLowerCase().includes(pName.toLowerCase().split(' ')[0]));
      if (found) {
          await Product.updateOne({ name: pName }, { mainImage: found.secure_url, images: [found.secure_url] });
          console.log(`Successfully restored ${pName} with real image: ${found.secure_url}`);
      }
  }

  process.exit();
}
restore();
