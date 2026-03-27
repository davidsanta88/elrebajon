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
const Order = require('./models/Order');
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

// Public: Fetch only active categories (or those without a status yet)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ status: { $ne: 'Inactivo' } }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Fetch all categories including inactive ones
app.get('/api/admin/categories', authMiddleware, adminMiddleware, async (req, res) => {
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
      image: req.file.path,
      status: req.body.status || 'Activo'
    });
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/categories/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, status } = req.body;
    let updateData = { name, status };
    if (req.file) {
      updateData.image = req.file.path;
    }
    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
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

app.post('/api/admin/products', authMiddleware, adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(file => file.path) : [];
    const productData = {
      ...req.body,
      images,
      mainImage: images.length > 0 ? images[0] : null,
      profitMargin: Number(req.body.price) - Number(req.body.purchasePrice)
    };
    const product = new Product(productData);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/products/:id', authMiddleware, adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    let updateData = { ...req.body };
    
    // If new images are uploaded, add them to the existing ones or replace? 
    // For now, let's treat it as a replace or append correctly.
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      updateData.images = newImages;
      updateData.mainImage = newImages[0];
    }

    if (req.body.price && req.body.purchasePrice) {
      updateData.profitMargin = Number(req.body.price) - Number(req.body.purchasePrice);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// STATS & REPORTS
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { start, end } = req.query;
    const dateQuery = {};
    if (start && end) {
      dateQuery.createdAt = { $gte: new Date(start), $lte: new Date(end) };
    }

    // 1. Basic Metrics
    const basicMetrics = await Order.aggregate([
      { $match: dateQuery },
      { $group: {
        _id: null,
        totalRevenue: { $sum: "$totalRevenue" },
        totalProfit: { $sum: "$totalProfit" },
        count: { $sum: 1 }
      }}
    ]);

    // 2. Daily Trend
    const dailyTrend = await Order.aggregate([
      { $match: dateQuery },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalRevenue" },
        profit: { $sum: "$totalProfit" }
      }},
      { $sort: { "_id": 1 } }
    ]);

    // 3. Category Distribution
    const categoryStats = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.category",
        value: { $sum: "$items.price" }
      }}
    ]);

    // 4. Top Products
    const topProducts = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.name",
        sales: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      metrics: basicMetrics[0] || { totalRevenue: 0, totalProfit: 0, count: 0 },
      dailyTrend,
      categoryStats,
      topProducts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// MOCK DATA GENERATOR
app.get('/api/admin/seed-orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Order.deleteMany({});
    const products = await Product.find();
    if (products.length === 0) return res.status(400).json({ message: 'No hay productos para simular ventas' });

    const mockOrders = [];
    const now = new Date();

    for (let i = 0; i < 30; i++) { // Last 30 days
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      const ordersPerDay = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < ordersPerDay; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        
        const totalRevenue = product.price * qty;
        const totalCost = product.purchasePrice * qty;
        
        mockOrders.push({
          items: [{
            productId: product._id,
            name: product.name,
            quantity: qty,
            price: product.price,
            purchasePrice: product.purchasePrice,
            category: product.category
          }],
          totalRevenue,
          totalCost,
          totalProfit: totalRevenue - totalCost,
          createdAt: date
        });
      }
    }

    await Order.insertMany(mockOrders);
    res.json({ message: `${mockOrders.length} ventas simuladas creadas` });
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
