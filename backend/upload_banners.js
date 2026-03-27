const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const images = [
  'banner_home_mixto_total_estufa_animales_final_1774640924220.png',
  'banner_home_alternativa_mobiliario_electro_1774640642696.png',
  'banner_home_el_rebajon_premium_final_1774640533505.png'
];

const basePath = 'C:\\Users\\USUARIO\\.gemini\\antigravity\\brain\\55d5f9d5-ae29-408f-8bcf-f65cd97846bc\\';

async function upload() {
  console.log('Starting banner upload to Cloudinary...');
  for (const img of images) {
    try {
      const result = await cloudinary.uploader.upload(path.join(basePath, img), {
        folder: 'elrebajon/banners',
        use_filename: true,
        unique_filename: false
      });
      console.log(`SUCCESS [${img}]: ${result.secure_url}`);
    } catch (err) {
      console.error(`FAILED [${img}]:`, err.message);
    }
  }
}

upload();
