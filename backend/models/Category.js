const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  image: { type: String, required: true }, // Cloudinary URL
  status: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
