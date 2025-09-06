require("dotenv").config();
const mongoose = require("mongoose");

console.log("🔍 Testing MongoDB connection...");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set");

// Show connection string without password for debugging
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log("Connection string (masked):", maskedUri);
}

// MongoDB connection options to handle SSL issues
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: false,
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/milksync", mongoOptions)
.then(() => {
  console.log("✅ MongoDB connected successfully!");
  console.log("Database:", mongoose.connection.db.databaseName);
  process.exit(0);
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  console.log("\n🔧 Please check:");
  console.log("1. Your MongoDB Atlas connection string in .env file");
  console.log("2. Your username and password are correct");
  console.log("3. Your IP address is whitelisted in MongoDB Atlas");
  console.log("4. Your cluster is running");
  console.log("\n🔧 Common issues:");
  console.log("- Password contains special characters (try without @ symbol)");
  console.log("- Username is incorrect");
  console.log("- IP address not whitelisted");
  console.log("- Try adding ?ssl=true&sslVerifyCertificate=false to your connection string");
  process.exit(1);
});
