const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function upload() {
  try {
    const result = await cloudinary.uploader.upload(
      'C:\\Users\\USUARIO\\.gemini\\antigravity\\brain\\3eb64845-6ead-424b-93f4-1a84de8294e2\\zapatos_tenis_categoria_1774900184641.png',
      {
        folder: 'elrebajon/categories',
        public_id: 'zapatos',
        overwrite: true
      }
    );
    console.log('✅ URL:', result.secure_url);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

upload();
