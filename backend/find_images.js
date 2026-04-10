const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function find() {
  const resources = await cloudinary.api.resources({ type: 'upload', max_results: 500, prefix: 'elrebajon/' });
  console.log('--- ALL EL REBAJON IMAGES ---');
  resources.resources.forEach(r => {
    console.log(`${r.public_id} -> ${r.secure_url}`);
  });
}

find().catch(console.error);
