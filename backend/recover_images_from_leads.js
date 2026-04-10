const mongoose = require('mongoose');
require('dotenv').config();

async function recover() {
  await mongoose.connect(process.env.MONGODB_URI);
  const leads = await mongoose.connection.db.collection('leads').find({ mainImage: { $ne: "" } }).toArray();
  console.log("Found leads with images:", leads.length);
  
  const recoveryMap = {};
  leads.forEach(l => {
    if (l.productId && l.mainImage) {
      recoveryMap[l.productId.toString()] = l.mainImage;
    }
  });

  console.log("Unique recovery mapping:", JSON.stringify(recoveryMap, null, 2));
  process.exit();
}
recover();
