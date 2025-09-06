const mongoose = require('mongoose');
const Product = require('../models/Product');
const Distributor = require('../models/Distributor');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateProductFields() {
  try {
    console.log('🔄 Starting product field migration...');
    
    // Get all products that still have the old 'company' field
    const productsWithCompany = await Product.find({ company: { $exists: true } });
    console.log(`📦 Found ${productsWithCompany.length} products with 'company' field`);
    
    if (productsWithCompany.length === 0) {
      console.log('✅ No products found with old company field. Migration not needed.');
      return;
    }
    
    // Get all distributors to map company names to distributor IDs
    const distributors = await Distributor.find({});
    console.log(`🚚 Found ${distributors.length} distributors`);
    
    // Create a mapping from company name to distributor ID
    const companyToDistributorMap = {};
    distributors.forEach(dist => {
      // Map both distributorName and name to the distributor ID
      if (dist.distributorName) {
        companyToDistributorMap[dist.distributorName] = dist._id;
      }
      if (dist.name) {
        companyToDistributorMap[dist.name] = dist._id;
      }
    });
    
    console.log('🗺️ Company to distributor mapping:', companyToDistributorMap);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const product of productsWithCompany) {
      const companyName = product.company;
      const distributorId = companyToDistributorMap[companyName];
      
      if (distributorId) {
        // Update the product to use distributorId instead of company
        await Product.findByIdAndUpdate(product._id, {
          $set: { distributorId: distributorId },
          $unset: { company: 1 }
        });
        
        console.log(`✅ Migrated product "${product.name}" from company "${companyName}" to distributor ID "${distributorId}"`);
        migratedCount++;
      } else {
        console.log(`⚠️ No distributor found for company "${companyName}" in product "${product.name}". Skipping...`);
        skippedCount++;
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} products`);
    console.log(`⚠️ Skipped (no distributor found): ${skippedCount} products`);
    console.log(`📦 Total products processed: ${productsWithCompany.length}`);
    
    if (skippedCount > 0) {
      console.log(`\n⚠️ Note: ${skippedCount} products were skipped because no matching distributor was found.`);
      console.log(`   You may need to manually assign these products to distributors or create the missing distributors.`);
    }
    
    console.log('\n🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
migrateProductFields();
