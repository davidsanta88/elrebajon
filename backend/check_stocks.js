require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const products = await Product.find({ stock: 0 });
    console.log('Products with 0 stock:');
    products.forEach(p => console.log(`- ${p.name} (Category: ${p.category})`));
    mongoose.connection.close();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
