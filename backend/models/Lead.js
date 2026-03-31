const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String },
  mainImage: { type: String },
  referrer: { type: String, enum: ['Header', 'Modal', 'Offer', 'Catalog'], default: 'Catalog' },
  status: { type: String, enum: ['Interesado', 'Contactado'], default: 'Interesado' },
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
