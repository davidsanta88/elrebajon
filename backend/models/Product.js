const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  purchasePrice: { type: Number }, // For Admin to track profit
  category: { 
    type: String, 
    enum: ['Hogar', 'Ropa', 'Animales', 'Electrodomésticos'],
    required: true 
  },
  image: { type: String }, // Cloudinary URL
  isOffer: { type: Boolean, default: false },
  stock: { type: Number, default: 0 },
  provider: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
