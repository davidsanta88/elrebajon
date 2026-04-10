const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Category = mongoose.model('Category', new mongoose.Schema({ name: String, image: String }));
  const Product = mongoose.model('Product', new mongoose.Schema({ name: String, mainImage: String, isOffer: Boolean }));

  console.log('--- VERIFYING CATEGORIES ---');
  const cats = await Category.find();
  cats.forEach(c => console.log(`${c.name}: ${c.image}`));

  console.log('--- VERIFYING KEY PRODUCTS ---');
  // Chanchito, Estufa, Colchon
  const products = await Product.find({ name: { $in: [/chanchito/i, /estufa/i, /colchon/i] } });
  products.forEach(p => console.log(`${p.name}: ${p.mainImage} (isOffer: ${p.isOffer})`));

  await mongoose.disconnect();
}

verify().catch(console.error);
