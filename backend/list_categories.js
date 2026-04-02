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
  const categories = await Category.find();
  console.log(JSON.stringify(categories, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
