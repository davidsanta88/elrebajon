const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  email: { type: String },
  website: { type: String },
  observation: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Provider', providerSchema);
