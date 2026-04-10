require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const Lead = require('./models/Lead');
const Product = require('./models/Product');
const Category = require('./models/Category');

async function fullRecovery() {
  try {
    console.log('--- SYSTEM RECOVERY STARTED ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Gather all unique products from Orders (87 orders)
    console.log('Fetching Orders for data mining...');
    const orders = await Order.find();
    console.log(`Found ${orders.length} orders.`);

    // 2. Gather all unique leads for Image recovery (6 leads)
    console.log('Fetching Leads for image recovery...');
    const leads = await Lead.find();
    const leadMap = {};
    leads.forEach(l => {
      if (l.productName && l.mainImage) {
        leadMap[l.productName.toLowerCase()] = l.mainImage;
      }
    });

    const productMap = {}; // Key: name.toLowerCase()
    const categoryNames = new Set();

    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const nameLower = (item.name || 'Sin Nombre').toLowerCase();
          
          if (!productMap[nameLower]) {
            productMap[nameLower] = {
              name: item.name || 'Producto Sin Nombre',
              price: item.price || 0,
              purchasePrice: item.purchasePrice || 0,
              category: item.category || 'Varios',
              brand: '---',
              provider: 'Proveedor Histórico',
              stock: 5, // Default stock for recovered items
              stockMin: 1,
              status: 'Activo',
              condition: 'Nuevo',
              description: `Producto recuperado del historial de ventas: ${item.name}`,
              mainImage: leadMap[nameLower] || 'https://res.cloudinary.com/adminhotel/image/upload/v1741014167/placeholder_pvh3q4.png'
            };
          }
          
          if (item.category) categoryNames.add(item.category);
        });
      }
    });

    const productsToCreate = Object.values(productMap);
    console.log(`Identified ${productsToCreate.length} unique products to restore.`);

    // 3. Clear existing Products and Restore (Careful: we keep the ones we found)
    await Product.deleteMany({});
    console.log('Cleared existing (empty/limited) product collection.');

    for (const pData of productsToCreate) {
      const product = new Product(pData);
      await product.save();
      console.log(`✅ Restored Product: ${product.name}`);
    }

    // 4. Rebuild Category collection
    console.log('Rebuilding Categories...');
    // Add categories from current set
    const currentCategories = Array.from(categoryNames);
    
    for (const catName of currentCategories) {
      const exists = await Category.findOne({ name: catName });
      if (!exists) {
        const cat = new Category({
          name: catName,
          image: '/categories/logo.png', // Generic placeholder, updated later
          status: 'Activo'
        });
        await cat.save();
        console.log(`✅ Created Category: ${catName}`);
      }
    }

    console.log('--- RECOVERY COMPLETED SUCCESSFULLY ---');
    console.log(`Total Products Restored: ${productsToCreate.length}`);
    console.log(`Total Categories Ensuring: ${categoryNames.size}`);

    process.exit(0);
  } catch (err) {
    console.error('CRITICAL RECOVERY ERROR:', err);
    process.exit(1);
  }
}

fullRecovery();
