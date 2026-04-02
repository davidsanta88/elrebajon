const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  city: { type: String, default: 'Desconocido' },
  region: { type: String, default: 'Desconocido' },
  country: { type: String, default: 'Desconocido' },
  lat: { type: Number },
  lon: { type: Number },
  userAgent: { type: String },
  device: { type: String },
  os: { type: String },
  browser: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Índice para búsqueda rápida por fecha
visitorSchema.index({ timestamp: 1 });
// Índice para búsqueda por IP y fecha (para evitar duplicados en el mismo día)
visitorSchema.index({ ip: 1, timestamp: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
