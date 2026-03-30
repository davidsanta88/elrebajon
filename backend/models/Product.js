const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  purchasePrice: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true, default: 0 },
  profitMargin: { type: Number, default: 0 },
  category: { type: String, required: true },
  brand: { type: String },
  provider: { type: String },
  stock: { type: Number, default: 0 },
  stockMin: { type: Number, default: 0 },
  status: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
  images: [{ type: String }], // Array of Cloudinary URLs
  mainImage: { type: String }, // Primary Cloudinary URL for cards
  condition: { type: String, enum: ['Nuevo', 'Usado'], default: 'Nuevo' },
  isOffer: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
