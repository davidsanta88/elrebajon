const mongoose = require('mongoose');
require('dotenv').config();

const CategorySchema = new mongoose.Schema({
  name: String,
  image: String,
  isVisible: { type: Boolean, default: true }
});
const Category = mongoose.model('Category', CategorySchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await Category.findOne({ name: 'Zapatos' });
  if (existing) {
    existing.image = 'https://res.cloudinary.com/doybjfqow/image/upload/v1/elrebajon/categories/zapatos.jpg';
    await existing.save();
    console.log('✅ Categoría Zapatos actualizada');
  } else {
    await Category.create({
      name: 'Zapatos',
      image: 'https://res.cloudinary.com/doybjfqow/image/upload/v1/elrebajon/categories/zapatos.jpg',
      isVisible: true
    });
    console.log('✅ Categoría Zapatos creada');
  }
  await mongoose.disconnect();
}

run().catch(console.error);
