require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Provider = require('./models/Provider');
const { authMiddleware, adminMiddleware } = require('./middleware/authMiddleware');
const { upload } = require('./config/cloudinary.js');

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

// Category Routes
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/categories', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Image is required' });
    
    const category = new Category({
      name,
      image: req.file.path
    });
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/categories/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Provider Routes
app.get('/api/providers', async (req, res) => {
  try {
    const providers = await Provider.find().sort({ name: 1 });
    res.json(providers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/providers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const provider = new Provider(req.body);
    await provider.save();
    res.json(provider);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/providers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(provider);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/providers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Provider.findByIdAndDelete(req.params.id);
    res.json({ message: 'Provider deleted' });
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

    // 2. Seed Categories
    const sampleCategories = [
      { name: 'Hogar', image: 'https://placehold.co/200x200?text=Hogar' },
      { name: 'Ropa', image: 'https://placehold.co/200x200?text=Ropa' },
      { name: 'Animales', image: 'https://placehold.co/200x200?text=Animales' },
      { name: 'Electrodomésticos', image: 'https://placehold.co/200x200?text=Electrodomésticos' }
    ];
    await Category.deleteMany({});
    const categories = await Category.insertMany(sampleCategories);

    // 3. Seed Providers
    const sampleProviders = [
      { name: 'Colchones ABC', phone: '3001234567', address: 'Calle 10 #20-30', email: 'ventas@abc.com', website: 'www.abc.com', observation: 'Distribuidor principal' },
      { name: 'HACEB', phone: '3109876543', address: 'Zona Industrial', email: 'contacto@haceb.com', website: 'www.haceb.com' },
      { name: 'Finca Local', phone: '3200000000', observation: 'Suministro semanal' }
    ];
    await Provider.deleteMany({});
    const providers = await Provider.insertMany(sampleProviders);

    // 4. Seed Sample Products
    const sampleProducts = [
      { name: 'Colchón Doble', price: 250000, purchasePrice: 180000, category: 'Hogar', isOffer: true, provider: 'Colchones ABC' },
      { name: 'Estufa a Gas', price: 300000, purchasePrice: 220000, category: 'Electrodomésticos', provider: 'HACEB' },
      { name: 'Chanchito', price: 450000, purchasePrice: 350000, category: 'Animales', provider: 'Finca Local' }
    ];
    await Product.deleteMany({});
    const created = await Product.insertMany(sampleProducts);
    res.json({ message: 'Data seeded successfully', categories, products: created });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
