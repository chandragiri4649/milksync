const mongoose = require('mongoose');
const Payment = require('./models/Payment');
const Distributor = require('./models/Distributor');
const Admin = require('./models/Admin');
require('dotenv').config();

async function createTestPayment() {
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

    // Find or create a test admin
    let admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      console.log('Test admin not found. Please create an admin first.');
      return;
    }
    console.log('Found test admin:', admin._id);

    // Check if payment already exists
    let existingPayment = await Payment.findOne({ distributorId: distributor._id });
    if (existingPayment) {
      console.log('Payment already exists for this distributor:', existingPayment._id);
      return;
    }

    // Create test payment
    const testPayment = new Payment({
      distributorId: distributor._id,
      amount: 250.00,
      paymentMethod: 'Cash',
      paymentDate: new Date(),
      receiptImageUrl: null, // No receipt for test
      createdBy: admin._id,
      notes: 'Test payment for order delivery'
    });

    await testPayment.save();
    console.log('Created test payment:', testPayment._id);
    console.log('Payment details:', {
      distributorId: testPayment.distributorId,
      amount: testPayment.amount,
      method: testPayment.paymentMethod,
      date: testPayment.paymentDate,
      createdBy: testPayment.createdBy
    });

    console.log('Test payment created successfully!');
    console.log('You can now test the distributor payment history with distributor ID:', distributor._id);

  } catch (error) {
    console.error('Error creating test payment:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestPayment();
