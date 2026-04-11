require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Lead = require('./models/Lead');
const Product = require('./models/Product');
const Visitor = require('./models/Visitor');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const orderCount = await Order.countDocuments();
    const leadCount = await Lead.countDocuments();
    const productCount = await Product.countDocuments();
    const visitorCount = await Visitor.countDocuments();

    console.log('Order Count:', orderCount);
    console.log('Lead Count:', leadCount);
    console.log('Product Count:', productCount);
    console.log('Visitor Count:', visitorCount);

    if (orderCount > 0) {
      const sampleOrders = await Order.find().limit(5);
      console.log('Sample Orders:', JSON.stringify(sampleOrders, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
