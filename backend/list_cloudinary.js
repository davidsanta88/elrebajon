const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function list() {
  try {
    const res = await cloudinary.api.resources({ type: 'upload', max_results: 100 });
    console.log("Cloudinary Resources Found:", res.resources.length);
    console.log(JSON.stringify(res.resources.map(r => r.secure_url), null, 2));
  } catch (err) {
    console.error("Cloudinary Error:", err);
  }
}
list();
