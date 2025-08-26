const mongoose = require("mongoose");
const Product = require("./models/Product");
require("dotenv").config();

const migrateProductCosts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/milksync", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Find all products without costPerTub
    const products = await Product.find({ costPerTub: { $exists: false } });
    console.log(`📦 Found ${products.length} products to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      try {
        if (product.costPerPacket && product.packetsPerTub) {
          // Calculate costPerTub from existing fields
          const costPerTub = product.costPerPacket * product.packetsPerTub;
          
          // Update the product
          await Product.findByIdAndUpdate(product._id, {
            costPerTub: costPerTub
          });
          
          console.log(`✅ Updated ${product.name}: costPerTub = ${costPerTub}`);
          updatedCount++;
        } else {
          console.log(`⚠️ Skipped ${product.name}: Missing costPerPacket or packetsPerTub`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${product.name}:`, error.message);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Updated: ${updatedCount} products`);
    console.log(`⚠️ Skipped: ${skippedCount} products`);
    console.log(`🎯 Total processed: ${products.length} products`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateProductCosts();
}

module.exports = migrateProductCosts;