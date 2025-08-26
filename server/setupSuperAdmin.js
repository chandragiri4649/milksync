/**
 * Super Admin Setup Script
 * 
 * This script creates a default Super Admin account that cannot be deleted or edited.
 * The Super Admin can be used to recover access if all other admins are locked out.
 * 
 * Usage: node setupSuperAdmin.js
 * 
 * Recovery Steps:
 * 1. If all admins are locked out, use Super Admin credentials
 * 2. Super Admin can create new admin accounts
 * 3. Super Admin can reset other admin passwords
 * 4. Super Admin account cannot be deleted through normal admin management
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/svdmilksync', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create Super Admin account
const createSuperAdmin = async () => {
  try {
    // Check if Super Admin already exists
    const existingSuperAdmin = await Admin.findOne({ isSuperAdmin: true });
    
    if (existingSuperAdmin) {
      console.log('Super Admin already exists:', existingSuperAdmin.username);
      console.log('Email:', existingSuperAdmin.email);
      return;
    }

    // Super Admin credentials
    const superAdminData = {
      username: 'superadmin',
      email: 'superadmin@domain.com',
      password: 'SuperAdmin@2024', // Default password - should be changed after first login
      isSuperAdmin: true
    };

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(superAdminData.password, saltRounds);

    // Create Super Admin
    const superAdmin = new Admin({
      username: superAdminData.username,
      email: superAdminData.email,
      password: hashedPassword,
      isSuperAdmin: true
    });

    await superAdmin.save();

    console.log('✅ Super Admin created successfully!');
    console.log('Username:', superAdminData.username);
    console.log('Email:', superAdminData.email);
    console.log('Password:', superAdminData.password);
    console.log('');
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('1. Change the default password after first login');
    console.log('2. Keep these credentials secure');
    console.log('3. Super Admin cannot be deleted through normal admin management');
    console.log('4. Use this account only for emergency recovery');

  } catch (error) {
    console.error('Error creating Super Admin:', error);
  }
};

// Main execution
const main = async () => {
  console.log('🔧 Setting up Super Admin account...');
  await connectDB();
  await createSuperAdmin();
  
  console.log('✅ Super Admin setup completed');
  process.exit(0);
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createSuperAdmin };
