require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

// Admin credentials from environment variables
const ADMIN_CREDENTIALS = {
  username: process.env.DEFAULT_ADMIN_USERNAME || "admin",
  email: process.env.DEFAULT_ADMIN_EMAIL || "durgsaivaraprasadchan@gmail.com",
  password: process.env.DEFAULT_ADMIN_PASSWORD || "admin123" // This will be hashed
};

async function resetAdminPassword() {
  try {
    // Connect to MongoDB Atlas
    console.log("🔗 Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/milksync");
    console.log("✅ Connected to MongoDB Atlas successfully!");

    // Find admin by username or email
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { username: ADMIN_CREDENTIALS.username },
        { email: ADMIN_CREDENTIALS.email }
      ]
    });

    if (!existingAdmin) {
      console.log("❌ Admin user not found!");
      console.log(`   Looking for username: ${ADMIN_CREDENTIALS.username}`);
      console.log(`   Looking for email: ${ADMIN_CREDENTIALS.email}`);
      console.log("   Please run: npm run seed:admin to create the admin user first.");
      return;
    }

    // Hash the new password
    console.log("🔐 Hashing new password...");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, saltRounds);

    // Update admin credentials
    console.log("👤 Updating admin user...");
    existingAdmin.username = ADMIN_CREDENTIALS.username;
    existingAdmin.email = ADMIN_CREDENTIALS.email;
    existingAdmin.password = hashedPassword;
    
    // Clear any existing reset tokens
    existingAdmin.resetPasswordToken = undefined;
    existingAdmin.resetPasswordExpires = undefined;

    await existingAdmin.save();
    console.log("✅ Admin user updated successfully!");
    console.log("📋 Updated credentials:");
    console.log(`   Username: ${ADMIN_CREDENTIALS.username}`);
    console.log(`   Email: ${ADMIN_CREDENTIALS.email}`);
    console.log(`   Password: ${ADMIN_CREDENTIALS.password}`);
    console.log("\n🔐 Please change the password after login for security!");

  } catch (error) {
    console.error("❌ Error updating admin user:", error.message);
    
    if (error.code === 11000) {
      console.log("💡 This error usually means there's a duplicate username or email.");
      console.log("   Make sure the username and email are unique.");
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
  resetAdminPassword()
    .then(() => {
      console.log("🎉 Script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = resetAdminPassword;
