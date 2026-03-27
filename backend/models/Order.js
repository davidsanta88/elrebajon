const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Sale Price at the time
    purchasePrice: { type: Number, required: true }, // Purchase Price at the time
    category: { type: String }
  }],
  totalRevenue: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  totalProfit: { type: Number, required: true },
  customerName: { type: String, default: 'Cliente Final' },
  status: { type: String, enum: ['Completado', 'Cancelado'], default: 'Completado' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
