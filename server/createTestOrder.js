const mongoose = require('mongoose');
const Order = require('./models/Order');
const Distributor = require('./models/Distributor');
const Product = require('./models/Product');
const Admin = require('./models/Admin');
require('dotenv').config();

async function createTestOrder() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/milksync');
    console.log('Connected to MongoDB');

    // Find or create a test distributor
    let distributor = await Distributor.findOne({ username: 'testdistributor' });
    if (!distributor) {
      distributor = new Distributor({
        distributorName: 'Test Company',
        name: 'Test Distributor',
        contact: '1234567890',
        username: 'testdistributor',
        password: 'password123',
        walletBalance: 1000
      });
      await distributor.save();
      console.log('Created test distributor:', distributor._id);
    } else {
      console.log('Found existing distributor:', distributor._id);
    }

    // Find or create a test product
    let product = await Product.findOne({ name: 'Test Milk' });
    if (!product) {
      product = new Product({
        company: 'Test Company',
        name: 'Test Milk',
        quantity: 100,
        unit: 'ml', // Fixed: using valid enum value
        costPerPacket: 10,
        packetsPerTub: 5,
        imageUrl: '/uploads/test.jpg'
      });
      await product.save();
      console.log('Created test product:', product._id);
    } else {
      console.log('Found existing product:', product._id);
    }

    // Find or create a test admin
    let admin = await Admin.findOne({ username: 'testadmin' });
    if (!admin) {
      admin = new Admin({
        username: 'testadmin',
        password: 'password123',
        email: 'test@admin.com'
      });
      await admin.save();
      console.log('Created test admin:', admin._id);
    } else {
      console.log('Found existing admin:', admin._id);
    }

    // Create a test order
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const testOrder = new Order({
      userId: admin._id,
      userModel: 'Admin',
      distributorId: distributor._id,
      customerName: 'Test Customer',
      orderDate: tomorrow,
      status: 'pending',
      locked: false,
      items: [
        {
          productId: product._id,
          quantity: 5,
          unit: 'tub'
        }
      ]
    });

    await testOrder.save();
    console.log('Created test order:', testOrder._id);
    console.log('Order details:', {
      distributorId: testOrder.distributorId,
      status: testOrder.status,
      orderDate: testOrder.orderDate,
      items: testOrder.items
    });

    console.log('Test order created successfully!');
    console.log('You can now test the distributor order history with distributor ID:', distributor._id);

  } catch (error) {
    console.error('Error creating test order:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestOrder();
