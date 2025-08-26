// Migration script to update existing orders with userModel field
const mongoose = require("mongoose");
const Order = require("./models/Order");
const Admin = require("./models/Admin");
const Staff = require("./models/Staff");

async function migrateOrders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/milksync", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("Connected to MongoDB");
    
    // Find all orders without userModel field
    const ordersToUpdate = await Order.find({ userModel: { $exists: false } });
    console.log(`Found ${ordersToUpdate.length} orders to migrate`);
    
    if (ordersToUpdate.length === 0) {
      console.log("No orders need migration");
      return;
    }
    
    // Update each order
    for (const order of ordersToUpdate) {
      try {
        // Try to find the user in Admin model first
        let adminUser = await Admin.findById(order.userId);
        if (adminUser) {
          order.userModel = 'Admin';
          await order.save();
          console.log(`Updated order ${order._id} with userModel: Admin`);
          continue;
        }
        
        // Try to find the user in Staff model
        let staffUser = await Staff.findById(order.userId);
        if (staffUser) {
          order.userModel = 'Staff';
          await order.save();
          console.log(`Updated order ${order._id} with userModel: Staff`);
          continue;
        }
        
        // If user not found in either model, set to Staff as default
        order.userModel = 'Staff';
        await order.save();
        console.log(`Updated order ${order._id} with userModel: Staff (default)`);
        
      } catch (err) {
        console.error(`Error updating order ${order._id}:`, err.message);
      }
    }
    
    console.log("Migration completed successfully");
    
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateOrders();
}

module.exports = migrateOrders;
