require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

// Default admin credentials from environment variables
const DEFAULT_ADMIN = {
  username: process.env.DEFAULT_ADMIN_USERNAME || "admin",
  email: process.env.DEFAULT_ADMIN_EMAIL || "durgsaivaraprasadchan@gmail.com",
  password: process.env.DEFAULT_ADMIN_PASSWORD || "admin123" // This will be hashed
};

async function createDefaultAdmin() {
  try {
    // Connect to MongoDB Atlas
    console.log("🔗 Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/milksync");
    console.log("✅ Connected to MongoDB Atlas successfully!");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { username: DEFAULT_ADMIN.username },
        { email: DEFAULT_ADMIN.email }
      ]
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log("   If you want to update the password, please use the admin panel or reset password feature.");
      console.log("   Or run: npm run seed:reset-admin");
      return;
    }

    // Hash the password
    console.log("🔐 Hashing password...");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);

    // Create new admin
    console.log("👤 Creating admin user...");
    const newAdmin = new Admin({
      username: DEFAULT_ADMIN.username,
      email: DEFAULT_ADMIN.email,
      password: hashedPassword
    });

    await newAdmin.save();
    console.log("✅ Admin user created successfully!");
    console.log("📋 Default credentials:");
    console.log(`   Username: ${DEFAULT_ADMIN.username}`);
    console.log(`   Email: ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log("\n🔐 Please change the password after first login for security!");

  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    
    if (error.code === 11000) {
      console.log("💡 This error usually means the admin already exists.");
      console.log("   Try checking if an admin with the same username or email already exists.");
    }
    
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  }
}

// Run the script
if (require.main === module) {
  createDefaultAdmin()
    .then(() => {
      console.log("🎉 Script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = createDefaultAdmin;
