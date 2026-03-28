require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function updateProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const productSets = [
      {
        name: "Zapato Deportivo Runner X",
        category: "Zapatos",
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop'
        ],
        price: 185000,
        condition: "Nuevo",
        isOffer: true
      },
      {
        name: "Camisa Oxford Elegance",
        category: "Ropa",
        images: [
          'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop'
        ],
        price: 95000,
        condition: "Nuevo",
        isOffer: false
      },
      {
        name: "Licuadora Pro-Master 1000W",
        category: "Electrodomésticos",
        images: [
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=800&auto=format&fit=crop'
        ],
        price: 345000,
        condition: "Nuevo",
        isOffer: true
      },
      {
        name: "Sofá Nordic Confort",
        category: "Hogar",
        images: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop'
        ],
        price: 1250000,
        condition: "Nuevo",
        isOffer: false
      },
      {
        name: "Chaqueta Cuero Rebel",
        category: "Ropa",
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1521223890158-f9f7ad3d1d6f?q=80&w=800&auto=format&fit=crop'
        ],
        price: 220000,
        condition: "Usado",
        isOffer: true
      },
      {
        name: "Horno Microondas Digital",
        category: "Electrodomésticos",
        images: [
          'https://images.unsplash.com/photo-1585333127302-748d0d13f98e?q=80&w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=800&auto=format&fit=crop'
        ],
        price: 480000,
        condition: "Nuevo",
        isOffer: false
      }
    ];

    await Product.deleteMany({});
    console.log('Base de datos limpiada');

    for (const pData of productSets) {
      const product = new Product({
        ...pData,
        mainImage: pData.images[0],
        description: `Artículo de alta gama: ${pData.name}. Seleccionado especialmente por su durabilidad y estilo. Disponible ahora en El Rebajón con entrega inmediata y garantía.`,
        purchasePrice: pData.price * 0.7,
        profitMargin: pData.price * 0.3,
        stock: 12,
        stockMin: 1,
        provider: "Proveedor Directo",
        status: "Activo"
      });
      await product.save();
      console.log(`Producto Creado: ${product.name}`);
    }

    console.log('✅ Base de datos actualizada con ÉXITO y fotos REALES.');
    process.exit(0);
  } catch (err) {
    console.error('Error al actualizar datos:', err);
    process.exit(1);
  }
}

updateProducts();
