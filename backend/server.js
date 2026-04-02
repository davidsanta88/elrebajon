require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Brand = require('./models/Brand');
const Provider = require('./models/Provider');
const Order = require('./models/Order');
const Lead = require('./models/Lead');
const Customer = require('./models/Customer');
const Location = require('./models/Location');
const Visitor = require('./models/Visitor');
const { authMiddleware, adminMiddleware } = require('./middleware/authMiddleware');
const { upload } = require('./config/cloudinary.js');
const axios = require('axios');
const useragent = require('express-useragent');
const requestIp = require('request-ip');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use(useragent.express());
app.use(requestIp.mw());

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
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Public: Fetch only active categories (or those without a status yet)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ status: { $ne: 'Inactivo' } }).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Admin: Fetch all categories including inactive ones
app.get('/api/admin/categories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error("STATS ERROR:", err);
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
    console.error("STATS ERROR:", err);
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error(`ID INVÁLIDO RECIBIDO CATEGORÍA: ${req.params.id}`);
      return res.status(400).json({ message: "ID de categoría no válido" });
    }
    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    res.json(category);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/categories/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Brand Routes
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await Brand.find({ status: { $ne: 'Inactivo' } }).sort({ name: 1 });
    res.json(brands);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/brands', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const brands = await Brand.find().sort({ category: 1, name: 1 });
    res.json(brands);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/brands', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const brand = new Brand(req.body);
    await brand.save();
    res.json(brand);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/brands/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(brand);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/brands/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Brand.findByIdAndDelete(req.params.id);
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Provider Routes
app.get('/api/providers', async (req, res) => {
  try {
    const providers = await Provider.find().sort({ name: 1 });
    res.json(providers);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/providers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const provider = new Provider(req.body);
    await provider.save();
    res.json(provider);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/providers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const provider = await Provider.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(provider);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/providers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Provider.findByIdAndDelete(req.params.id);
    res.json({ message: 'Provider deleted' });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Location Routes
app.get('/api/admin/locations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const locations = await Location.find().sort({ name: 1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/locations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const location = new Location(req.body);
    await location.save();
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/locations/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/locations/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ message: 'Location deleted' });
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
    console.error("STATS ERROR:", err);
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
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/products/:id', authMiddleware, adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    let updateData = { ...req.body };
    
    // If new images are uploaded, add them to the existing ones
    let existingImages = [];
    if (req.body.images) {
      existingImages = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }
    
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      updateData.images = [...existingImages, ...newImages].slice(0, 5);
    } else {
      updateData.images = existingImages;
    }
    
    if (updateData.images && updateData.images.length > 0) {
      updateData.mainImage = updateData.images[0];
    } else {
      updateData.mainImage = null;
    }

    if (req.body.price && req.body.purchasePrice) {
      updateData.profitMargin = Number(req.body.price) - Number(req.body.purchasePrice);
    }

    // Limpieza de valores nulos enviados como string
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === 'null' || updateData[key] === 'undefined') {
        updateData[key] = null;
      }
    });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error(`ID INVÁLIDO RECIBIDO: ${req.params.id}`);
      return res.status(400).json({ message: "ID de producto no válido: " + req.params.id });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/products/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// STATS & REPORTS
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { start, end, range } = req.query;
    const dateQuery = {};

    if (start && end) {
      dateQuery.createdAt = { $gte: new Date(start), $lte: new Date(end) };
    } else if (range) {
      const now = new Date();
      const days = parseInt(range) || 30;
      const from = new Date();
      from.setDate(now.getDate() - days);
      dateQuery.createdAt = { $gte: from, $lte: now };
    }

    // 1. Basic Metrics
    const basicMetrics = await Order.aggregate([
      { $match: dateQuery },
      { $group: {
        _id: null,
        totalRevenue: { $sum: { $ifNull: ["$totalRevenue", 0] } },
        totalProfit: { $sum: { $ifNull: ["$totalProfit", 0] } },
        totalCost: { $sum: { $ifNull: ["$totalCost", 0] } },
        count: { $sum: 1 }
      }}
    ]);

    // 2. Daily Trend
    const dailyTrend = await Order.aggregate([
      { $match: dateQuery },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: { $ifNull: ["$createdAt", new Date()] } } },
        revenue: { $sum: { $ifNull: ["$totalRevenue", 0] } },
        profit: { $sum: { $ifNull: ["$totalProfit", 0] } },
        orders: { $sum: 1 }
      }},
      { $sort: { "_id": 1 } }
    ]);

    // 3. Category Distribution
    const categoryStats = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: "$items" },
      { $group: {
        _id: { $ifNull: ["$items.category", "Sin Categoría"] },
        value: { $sum: { $multiply: [{ $ifNull: ["$items.price", 0] }, { $ifNull: ["$items.quantity", 0] }] } },
        units: { $sum: { $ifNull: ["$items.quantity", 0] } }
      }},
      { $sort: { value: -1 } }
    ]);

    // 4. Top Products
    const topProducts = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: "$items" },
      { $group: {
        _id: { $ifNull: ["$items.name", "Producto Desconocido"] },
        sales: { $sum: { $ifNull: ["$items.quantity", 0] } },
        revenue: { $sum: { $multiply: [{ $ifNull: ["$items.price", 0] }, { $ifNull: ["$items.quantity", 0] }] } },
        profit: { $sum: { $multiply: [
          { $subtract: [{ $ifNull: ["$items.price", 0] }, { $ifNull: ["$items.purchasePrice", 0] }] }, 
          { $ifNull: ["$items.quantity", 0] }
        ]} }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // 5. Provider Stats (NEW)
    const providerStats = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: "$items" },
      { $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "productInfo"
      }},
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: { $ifNull: ["$productInfo.provider", "Varios"] },
        revenue: { $sum: { $multiply: [{ $ifNull: ["$items.price", 0] }, { $ifNull: ["$items.quantity", 0] }] } },
        units: { $sum: { $ifNull: ["$items.quantity", 0] } }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 8 }
    ]);

    // 6. Lead Stats (NEW)
    const totalLeads = await Lead.countDocuments(dateQuery);
    const leadsByProduct = await Lead.aggregate([
      { $match: dateQuery },
      { $group: {
        _id: "$productName",
        count: { $sum: 1 },
        mainImage: { $first: "$mainImage" }
      }},
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      metrics: {
        ...(basicMetrics[0] || { totalRevenue: 0, totalProfit: 0, totalCost: 0, count: 0 }),
        totalLeads
      },
      dailyTrend,
      categoryStats,
      topProducts,
      providerStats,
      leadsByProduct
    });
  } catch (err) {
    console.error("CRITICAL STATS ERROR:", err);
    res.status(500).json({ message: "Error interno procesando estadísticas: " + err.message });
  }
});

// INVENTORY REPORT
app.get('/api/admin/reports/inventory', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const products = await Product.find().sort({ stock: 1 });

    // KPI Summary
    let capitalInvertido = 0;
    let valorPotencial = 0;
    let gananciaPotencial = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const categoryMap = {};
    const providerMap = {};

    products.forEach(p => {
      capitalInvertido += (p.purchasePrice || 0) * (p.stock || 0);
      valorPotencial += (p.price || 0) * (p.stock || 0);
      gananciaPotencial += ((p.price || 0) - (p.purchasePrice || 0)) * (p.stock || 0);
      if (p.stock === 0) outOfStockCount++;
      else if (p.stock <= p.stockMin) lowStockCount++;

      // Category distribution
      if (!categoryMap[p.category]) categoryMap[p.category] = { name: p.category, stock: 0, value: 0, products: 0 };
      categoryMap[p.category].stock += p.stock;
      categoryMap[p.category].value += (p.price || 0) * (p.stock || 0);
      categoryMap[p.category].products += 1;

      // Provider distribution
      const provKey = p.provider || 'Sin Proveedor';
      if (!providerMap[provKey]) providerMap[provKey] = { name: provKey, stock: 0, value: 0, products: 0 };
      providerMap[provKey].stock += p.stock;
      providerMap[provKey].value += (p.price || 0) * (p.stock || 0);
      providerMap[provKey].products += 1;
    });

    // Top by margin %
    const topMargin = products
      .filter(p => p.purchasePrice > 0)
      .map(p => ({
        name: p.name,
        category: p.category,
        margin: p.price - p.purchasePrice,
        marginPct: Number((((p.price - p.purchasePrice) / p.purchasePrice) * 100).toFixed(1)),
        stock: p.stock,
        price: p.price,
        purchasePrice: p.purchasePrice
      }))
      .sort((a, b) => b.marginPct - a.marginPct)
      .slice(0, 10);

    res.json({
      summary: {
        totalProducts: products.length,
        capitalInvertido,
        valorPotencial,
        gananciaPotencial,
        lowStockCount,
        outOfStockCount
      },
      products: products.map(p => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        provider: p.provider,
        brand: p.brand,
        stock: p.stock,
        stockMin: p.stockMin,
        purchasePrice: p.purchasePrice,
        price: p.price,
        margin: p.price - p.purchasePrice,
        marginPct: p.purchasePrice > 0 ? Number((((p.price - p.purchasePrice) / p.purchasePrice) * 100).toFixed(1)) : 0,
        capitalItem: (p.purchasePrice || 0) * (p.stock || 0),
        status: p.status,
        mainImage: p.mainImage
      })),
      categoryDistribution: Object.values(categoryMap).sort((a, b) => b.value - a.value),
      providerDistribution: Object.values(providerMap).sort((a, b) => b.value - a.value),
      topMargin
    });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// PROFITABILITY REPORT
app.get('/api/admin/reports/profitability', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ purchasePrice: { $gt: 0 } });

    const profitability = products.map(p => {
      const margin = p.price - p.purchasePrice;
      const marginPct = ((margin / p.purchasePrice) * 100);
      let tier = 'low';
      if (marginPct >= 30) tier = 'high';
      else if (marginPct >= 10) tier = 'mid';

      return {
        _id: p._id,
        name: p.name,
        category: p.category,
        provider: p.provider,
        purchasePrice: p.purchasePrice,
        price: p.price,
        margin: Number(margin.toFixed(0)),
        marginPct: Number(marginPct.toFixed(1)),
        stock: p.stock,
        capitalItem: p.purchasePrice * p.stock,
        potentialProfit: margin * p.stock,
        tier,
        mainImage: p.mainImage
      };
    }).sort((a, b) => b.marginPct - a.marginPct);

    const avgMarginPct = profitability.length > 0
      ? Number((profitability.reduce((s, p) => s + p.marginPct, 0) / profitability.length).toFixed(1))
      : 0;

    const tierCounts = {
      high: profitability.filter(p => p.tier === 'high').length,
      mid: profitability.filter(p => p.tier === 'mid').length,
      low: profitability.filter(p => p.tier === 'low').length,
    };

    res.json({ profitability, avgMarginPct, tierCounts, total: profitability.length });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// LEADS INTERACTION (PUBLIC)
app.post('/api/leads', async (req, res) => {
  try {
    const { productId, productName, price, category, mainImage, referrer } = req.body;
    const lead = new Lead({ productId, productName, price, category, mainImage, referrer });
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    console.error("LEAD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// LEADS REPORT (ADMIN)
app.get('/api/admin/reports/leads', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 }).limit(100);
    res.json(leads);
  } catch (err) {
    console.error("PROFITABILITY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- TRAFFIC ANALYTICS ---

// Public: Track visitor
app.post('/api/analytics/track', async (req, res) => {
  try {
    const clientIp = req.clientIp || req.ip;
    
    // Evitar duplicados por IP en la última hora (para no saturar la DB)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingVisit = await Visitor.findOne({ 
      ip: clientIp, 
      timestamp: { $gt: oneHourAgo } 
    });

    if (existingVisit) {
      return res.json({ status: 'skipped', message: 'Recent visit recorded' });
    }

    // Georeferenciación (Usando ip-api.com - Free tier)
    let geo = { city: 'Desconocido', regionName: 'Desconocido', country: 'Desconocido', lat: 0, lon: 0 };
    try {
      // Nota: ip-api.com free tier es HTTP. Si el server está en HTTPS, esto igual funciona desde el backend.
      const geoRes = await axios.get(`http://ip-api.com/json/${clientIp}`);
      if (geoRes.data && geoRes.data.status === 'success') {
        geo = geoRes.data;
      }
    } catch (geoErr) {
      console.warn("Geolocation service failed:", geoErr.message);
    }

    const visitor = new Visitor({
      ip: clientIp,
      city: geo.city || 'Desconocido',
      region: geo.regionName || 'Desconocido',
      country: geo.country || 'Desconocido',
      lat: geo.lat,
      lon: geo.lon,
      userAgent: req.headers['user-agent'],
      device: req.useragent.isMobile ? 'Mobile' : req.useragent.isTablet ? 'Tablet' : 'Desktop',
      os: req.useragent.os,
      browser: req.useragent.browser,
      timestamp: new Date()
    });

    await visitor.save();
    res.status(201).json({ status: 'success', city: visitor.city });
  } catch (err) {
    console.error("TRACKING ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Admin: Traffic Report
app.get('/api/admin/reports/traffic', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.range) || 30;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const dateQuery = { timestamp: { $gte: from } };

    // 1. Daily Trend
    const dailyTrend = await Visitor.aggregate([
      { $match: dateQuery },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        visitors: { $sum: 1 }
      }},
      { $sort: { "_id": 1 } }
    ]);

    // 2. Municipalities (Cities)
    const municipalityStats = await Visitor.aggregate([
      { $match: dateQuery },
      { $group: {
        _id: "$city",
        count: { $sum: 1 },
        lat: { $first: "$lat" },
        lon: { $first: "$lon" },
        region: { $first: "$region" }
      }},
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // 3. Device Distribution
    const deviceStats = await Visitor.aggregate([
      { $match: dateQuery },
      { $group: {
        _id: "$device",
        count: { $sum: 1 }
      }}
    ]);

    // 4. Recent Real-time Markers (for the map)
    // Coordenadas únicas con conteo para el mapa
    const mapPoints = await Visitor.aggregate([
      { $match: dateQuery },
      { $group: {
        _id: { lat: "$lat", lon: "$lon", city: "$city" },
        count: { $sum: 1 }
      }},
      { $project: {
        _id: 0,
        lat: "$_id.lat",
        lon: "$_id.lon",
        city: "$_id.city",
        count: 1
      }}
    ]);

    res.json({
      dailyTrend,
      municipalityStats,
      deviceStats,
      mapPoints,
      totalVisitors: await Visitor.countDocuments(dateQuery)
    });
  } catch (err) {
    console.error("TRAFFIC REPORT ERROR:", err);
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
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- REAL SALES & PLAN SEPARE MANAGEMENT ---

// Admin: Product lookup for creating manual sales
app.get('/api/admin/products/search', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const query = q ? { 
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    } : {};
    const products = await Product.find(query).limit(50).select('name price purchasePrice category mainImage stock');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Create Manual Order (Sale)
app.post('/api/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { items, customerName, customerPhone, initialPayment, isPlanSepare, note, totalRevenue } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'El pedido debe tener al menos un producto' });
    }

    let calculatedRevenue = 0;
    let totalCost = 0;
    
    // Process items and check stock
    for (const item of items) {
      calculatedRevenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      totalCost += (Number(item.purchasePrice) || 0) * (Number(item.quantity) || 0);

      // Decrement stock in database
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -(Number(item.quantity) || 0) }
        });
      }
    }

    // Use provided totalRevenue (manual price) or fall back to calculated
    const finalRevenue = totalRevenue !== undefined && totalRevenue !== null 
      ? Number(totalRevenue) 
      : calculatedRevenue;

    const order = new Order({
      items,
      totalRevenue: finalRevenue,
      totalCost: Number(totalCost) || 0,
      totalProfit: Number(finalRevenue - totalCost) || 0,
      customerName: customerName || 'Cliente Final',
      customerPhone: customerPhone || '',
      isPlanSepare: Boolean(isPlanSepare),
      payments: Number(initialPayment) > 0 ? [{ 
        amount: Number(initialPayment), 
        method: req.body.paymentMethod || 'Efectivo', 
        note: note || 'Abono Inicial',
        date: new Date()
      }] : []
    });

    await order.save();

    // Auto-create or Update Customer
    if (customerPhone && customerPhone.trim() !== "") {
      try {
        await Customer.findOneAndUpdate(
          { phone: customerPhone },
          { 
            name: customerName || 'Cliente Final', 
            $inc: { totalSpent: finalRevenue, ordersCount: 1 } 
          },
          { upsert: true, new: true }
        );
      } catch (custErr) {
        console.error("CUSTOMER SYNC ERROR:", custErr);
      }
    }

    res.status(201).json(order);
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ 
      message: "Error al registrar la venta", 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Admin: List Orders with filtering
app.get('/api/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { q, status } = req.query;
    let filter = {};
    if (status && status !== 'Todos') filter.paymentStatus = status;
    if (q) {
      filter.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { customerPhone: { $regex: q, $options: 'i' } }
      ];
    }
    
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Register a Payment (Abono)
app.post('/api/admin/orders/:id/payments', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { amount, method, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Venta no encontrada' });
    
    order.payments.push({ 
      amount: Number(amount), 
      method: method || 'Efectivo', 
      note, 
      date: new Date() 
    });
    
    await order.save();
    res.json(order);
  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- CUSTOMER MANAGEMENT ---
app.get('/api/admin/customers/search', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const query = q ? {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    } : {};
    const customers = await Customer.find(query).limit(10);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/customers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Delete Order
app.delete('/api/admin/orders/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Venta eliminada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Cartera Report (Debt)
app.get('/api/admin/reports/cartera', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.aggregate([
      { $match: { paymentStatus: 'Pendiente' } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerPhone',
          foreignField: 'phone',
          as: 'customerDetails'
        }
      },
      {
        $addFields: {
          customerInfo: { $arrayElemAt: ['$customerDetails', 0] }
        }
      },
      {
        $project: {
          customerDetails: 0
        }
      }
    ]);
    
    const totalReceivable = orders.reduce((sum, o) => sum + (o.balance || 0), 0);
    res.json({ orders, totalReceivable });
  } catch (err) {
    console.error("CARTERA REPORT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Public: Fetch products for Home
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Public: Fetch active offers only (isOffer=true and within date range)
app.get('/api/offers', async (req, res) => {
  try {
    const now = new Date();
    const offers = await Product.find({
      isOffer: true,
      status: 'Activo',
      $or: [
        { offerStartDate: null, offerEndDate: null },
        { offerStartDate: { $lte: now }, offerEndDate: { $gte: now } },
        { offerStartDate: null, offerEndDate: { $gte: now } },
        { offerStartDate: { $lte: now }, offerEndDate: null },
      ]
    }).sort({ updatedAt: -1 });
    res.json(offers);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// Admin: Configure offer fields on a product (toggle + prices + dates)
app.put('/api/admin/products/:id/offer', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { isOffer, offerPrice, originalPrice, offerStartDate, offerEndDate } = req.body;
    const updateData = {
      isOffer: Boolean(isOffer),
      offerPrice: isOffer ? Number(offerPrice) : null,
      originalPrice: isOffer ? Number(originalPrice) : null,
      offerStartDate: isOffer && offerStartDate ? new Date(offerStartDate) : null,
      offerEndDate: isOffer && offerEndDate ? new Date(offerEndDate) : null,
    };
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// CUSTOMER MANAGEMENT (ADMIN)
app.get('/api/admin/customers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    const query = q ? {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ]
    } : {};
    const customers = await Customer.find(query).sort({ updatedAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/customers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    const existing = await Customer.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Ya existe un cliente con este teléfono' });
    
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/customers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/customers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cliente eliminado' });
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
      { name: 'Hogar', image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800' },
      { name: 'Ropa', image: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&q=80&w=800' },
      { name: 'Animales', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800' },
      { name: 'Electrodomésticos', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800' },
      { name: 'Zapatos', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800' }
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
      { name: 'Colchón Doble', price: 250000, purchasePrice: 180000, category: 'Hogar', isOffer: true, provider: 'Colchones ABC', stock: 10 },
      { name: 'Estufa a Gas', price: 300000, purchasePrice: 220000, category: 'Electrodomésticos', provider: 'HACEB', stock: 15 },
      { name: 'Chanchito', price: 450000, purchasePrice: 350000, category: 'Animales', provider: 'Finca Local', stock: 5 }
    ];
    await Product.deleteMany({});
    const created = await Product.insertMany(sampleProducts);
    res.json({ message: 'Data seeded successfully', categories, products: created });
  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
