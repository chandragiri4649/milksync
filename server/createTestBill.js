const mongoose = require('mongoose');
const Bill = require('./models/Bill');
const Order = require('./models/Order');
const Distributor = require('./models/Distributor');
const Product = require('./models/Product');
const Admin = require('./models/Admin');
require('dotenv').config();

async function createTestBill() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/milksync');
    console.log('Connected to MongoDB');

    // Find the test distributor
    let distributor = await Distributor.findOne({ username: 'testdistributor' });
    if (!distributor) {
      console.log('Test distributor not found. Please run createTestOrder.js first.');
      return;
    }
    console.log('Found test distributor:', distributor._id);

    // Find the test order
    let order = await Order.findOne({ distributorId: distributor._id });
    if (!order) {
      console.log('Test order not found. Please run createTestOrder.js first.');
      return;
    }
    console.log('Found test order:', order._id);

    // Check if bill already exists
    let existingBill = await Bill.findOne({ orderId: order._id });
    if (existingBill) {
      console.log('Bill already exists for this order:', existingBill._id);
      return;
    }

    // Create test bill
    const testBill = new Bill({
      distributorId: distributor._id,
      orderId: order._id,
      billDate: new Date(),
      items: [
        {
          productName: 'Test Milk',
          quantityTubs: 5,
          costPerTub: 50.00,
          totalCost: 250.00
        }
      ],
      totalBillAmount: 250.00,
      locked: false
    });

    await testBill.save();
    console.log('Created test bill:', testBill._id);
    console.log('Bill details:', {
      distributorId: testBill.distributorId,
      orderId: testBill.orderId,
      totalAmount: testBill.totalBillAmount,
      items: testBill.items
    });

    console.log('Test bill created successfully!');
    console.log('You can now test the distributor bills history with distributor ID:', distributor._id);

  } catch (error) {
    console.error('Error creating test bill:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestBill();
