const mongoose = require('mongoose');
require('dotenv').config();

const CategorySchema = new mongoose.Schema({
  name: String,
  image: String,
  status: String
});
const Category = mongoose.model('Category', CategorySchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const updates = [
    { name: 'Animales', image: '/categories/animales.png' },
    { name: 'Hogar', image: '/categories/hogar.png' },
    { name: 'Electrodomésticos', image: '/categories/electrodomesticos.png' },
    { name: 'Ropa', image: '/categories/ropa.png' }
  ];

  for (const item of updates) {
    const res = await Category.updateOne({ name: item.name }, { $set: { image: item.image } });
    if (res.matchedCount > 0) {
      console.log(`✅ Updated ${item.name} to ${item.image}`);
    } else {
      // In case it doesn't exist, create it if you want, but better just warn
      console.log(`⚠️ Category ${item.name} not found in DB`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
