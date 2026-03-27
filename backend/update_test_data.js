require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function updateProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find().limit(3);
    
    if (products.length > 0) {
      // Product 1: Multiple images
      products[0].images = [
        products[0].mainImage,
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1556912177-3331cf31034c?auto=format&fit=crop&q=80'
      ];
      products[0].description = "Potente estufa de alta gama, fabricada con los mejores materiales. Cuenta con 4 quemadores de alta eficiencia, horno autolimpiante y diseño moderno en acero inoxidable. Ideal para el hogar moderno. ¡Aprovecha esta excelente oportunidad!";
      await products[0].save();
      console.log(`Updated ${products[0].name}`);

      // Product 2: Detailed description
      if (products[1]) {
        products[1].images = [
          products[1].mainImage,
          'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80'
        ];
        products[1].description = "Mueble multifuncional de madera maciza, perfecto para organizar tu sala o habitación. Resistente, elegante y con acabados de primera calidad. Producto garantizado por El Rebajon. Condición impecable.";
        await products[1].save();
        console.log(`Updated ${products[1].name}`);
      }
    }

    console.log('Test data updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error updating data:', err);
    process.exit(1);
  }
}

updateProducts();
