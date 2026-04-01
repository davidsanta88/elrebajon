const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/Product');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const result = await Product.updateMany({ stock: 0 }, { stock: 10, stockMin: 1 });
    console.log(`Updated ${result.modifiedCount} products stock to 10.`);
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

