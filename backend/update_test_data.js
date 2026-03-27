require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function updateProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Sample High-Quality Image Sets (Unsplash)
    const set1 = [
      'https://images.unsplash.com/photo-1595245312323-64a6f2331591?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595245312061-46bb60ed3026?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595245312328-916965675cc2?q=80&w=800&auto=format&fit=crop'
    ];
    const set2 = [
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583847268926-7243b6797cc9?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583847268154-15f18704259b?q=80&w=800&auto=format&fit=crop'
    ];
    const set3 = [
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540575861501-7ce3e220cce3?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621333100318-ae7f8ba1ef40?q=80&w=800&auto=format&fit=crop'
    ];

    const products = await Product.find().limit(10);
    
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        let set = set1;
        if (i % 3 === 1) set = set2;
        if (i % 3 === 2) set = set3;

        p.images = set;
        p.mainImage = set[0];
        p.description = `Este producto es ideal para el uso diario en el hogar. Es de alta calidad, duradero y cuenta con garantia directa. Perfecto para familias que buscan lo mejor al mejor precio. ${p.name} es lider en su categoria.`;
        
        // Mark some as offers for testing
        if (i % 2 === 0) {
            p.isOffer = true;
        } else {
            p.isOffer = false;
        }

        await p.save();
        console.log(`Updated: ${p.name} - Offer: ${p.isOffer}`);
    }

    console.log('Finished updating 10 sample products with carousels and offers.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating data:', err);
    process.exit(1);
  }
}

updateProducts();
