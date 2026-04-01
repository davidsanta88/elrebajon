const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  method: { type: String, default: 'Efectivo' },
  note: { type: String }
}, { _id: true });

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
  customerPhone: { type: String },
  
  // Payment tracking (Plan Separe)
  payments: [paymentSchema],
  totalPaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  isPlanSepare: { type: Boolean, default: false },
  paymentStatus: { 
    type: String, 
    enum: ['Pendiente', 'Pagado', 'Cancelado'], 
    default: 'Pagado' 
  },
  
  status: { type: String, enum: ['Completado', 'Cancelado'], default: 'Completado' },
}, { timestamps: true });

// Middleware to calculate balance before saving
orderSchema.pre('save', async function() {
  const payments = this.payments || [];
  this.totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const revenue = this.totalRevenue || 0;
  this.balance = Math.max(0, revenue - this.totalPaid);
  
  if (this.balance <= 0) {
    this.paymentStatus = 'Pagado';
    this.balance = 0;
  } else {
    this.paymentStatus = 'Pendiente';
  }
});

module.exports = mongoose.model('Order', orderSchema);
