require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const { authMiddleware, adminMiddleware } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin-only: Fetch products with details (like purchase price)
app.get('/api/admin/products', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public: Fetch products for Home
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// For demonstration: Seed data endpoint (Changed to GET for easier access)
app.get('/api/seed', async (req, res) => {
  try {
    // 1. Seed Admin User
    const adminEmail = 'admin@elrebajon.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({ email: adminEmail, password: 'admin123', role: 'admin' });
      await admin.save();
      console.log('Admin user seeded: admin@elrebajon.com / admin123');
    }

    // 2. Seed Sample Products
    const sampleProducts = [
      { name: 'Colchón Doble', price: 250000, purchasePrice: 180000, category: 'Hogar', isOffer: true, provider: 'Colchones ABC' },
      { name: 'Estufa a Gas', price: 300000, purchasePrice: 220000, category: 'Electrodomésticos', provider: 'HACEB' },
      { name: 'Chanchito', price: 450000, purchasePrice: 350000, category: 'Animales', provider: 'Finca Local' }
    ];
    await Product.deleteMany({});
    const created = await Product.insertMany(sampleProducts);
    res.json({ message: 'Data seeded successfully', products: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
