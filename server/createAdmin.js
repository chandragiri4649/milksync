const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Update the path if your structure is different
const Admin = require("./models/Admin");

async function createAdmin() {
  // Replace with your MongoDB URI if different
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/milksync");

  const username = "Admin1"; // Set your desired username
  const passwordPlain = "Admin1@123"; // Set your secure password here

  const passwordHashed = await bcrypt.hash(passwordPlain, 10);

  // Check if admin already exists
  const existing = await Admin.findOne({ username });
  if (existing) {
    console.log("Admin user already exists.");
    mongoose.disconnect();
    return;
  }

  await Admin.create({ username, password: passwordHashed });
  console.log(`Admin user created: ${username}`);
  mongoose.disconnect();
}

createAdmin();
