// Database Migration Script: Update Distributor Model from 'name' to 'companyName'
// Run this script in your MongoDB shell or as a Node.js script

const { MongoClient } = require('mongodb');

async function migrateDistributors() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/milksync';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const distributorsCollection = db.collection('distributors');

    // Step 1: Add companyName field to all existing distributors
    console.log('Step 1: Adding companyName field to existing distributors...');
    
    const result = await distributorsCollection.updateMany(
      { name: { $exists: true } },
      [
        {
          $set: {
            companyName: "$name"
          }
        }
      ]
    );

    console.log(`Updated ${result.modifiedCount} distributors`);

    // Step 2: Verify the migration
    console.log('Step 2: Verifying migration...');
    
    const distributors = await distributorsCollection.find({}).toArray();
    console.log(`Total distributors: ${distributors.length}`);
    
    const withCompanyName = distributors.filter(d => d.companyName);
    console.log(`Distributors with companyName: ${withCompanyName.length}`);
    
    const withoutCompanyName = distributors.filter(d => !d.companyName);
    console.log(`Distributors without companyName: ${withoutCompanyName.length}`);

    if (withoutCompanyName.length > 0) {
      console.log('Warning: Some distributors do not have companyName field:');
      withoutCompanyName.forEach(d => {
        console.log(`  - ID: ${d._id}, distributorName: ${d.distributorName}`);
      });
    }

    // Step 3: Optional - Remove the old 'name' field
    console.log('Step 3: Removing old "name" field...');
    
    const removeResult = await distributorsCollection.updateMany(
      { name: { $exists: true } },
      {
        $unset: { name: "" }
      }
    );

    console.log(`Removed 'name' field from ${removeResult.modifiedCount} distributors`);

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateDistributors().catch(console.error);
}

module.exports = { migrateDistributors };
