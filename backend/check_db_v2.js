const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const ProductSchema = new mongoose.Schema({ name: String, mainImage: String, isOffer: Boolean }, { collection: 'products' });
  const CategorySchema = new mongoose.Schema({ name: String, image: String }, { collection: 'categories' });
  
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
  const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

  console.log('--- PRODUCTS ---');
  const products = await Product.find({ name: { $in: ['CHANCHITO', 'ESTUFA A GAS', 'COLCHÓN DOBLE'] } });
  console.log(JSON.stringify(products, null, 2));

  console.log('--- CATEGORIES ---');
  const categories = await Category.find();
  console.log(JSON.stringify(categories, null, 2));

  await mongoose.disconnect();
}

check().catch(console.error);
