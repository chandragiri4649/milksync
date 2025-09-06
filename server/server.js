// SSL bypass only for development - automatically disabled in production
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = require("./app");
const mongoose = require("mongoose");

// MongoDB connection options with modern SSL handling
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority',
  serverSelectionTimeoutMS: 30000, // Increased timeout
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000, // Increased timeout
  maxPoolSize: 10,
  minPoolSize: 1,
  // Modern SSL options for MongoDB Atlas
  ssl: true,
  // Remove deprecated sslValidate option
  // Additional options to handle TLS issues
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
};

// Use the connection string directly without adding deprecated SSL parameters
const getConnectionString = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) return "mongodb://localhost:27017/milksync";
  return uri;
};

mongoose.connect(getConnectionString(), mongoOptions)
.then(() => {
  console.log("✅ MongoDB connected successfully!");
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
  console.log("\n🔧 Troubleshooting tips:");
  console.log("1. Check your MONGODB_URI in .env file");
  console.log("2. Ensure your IP is whitelisted in MongoDB Atlas");
  console.log("3. Verify username/password are correct");
  console.log("4. Check if your MongoDB Atlas cluster is running");
  console.log("5. Try adding ?ssl=true&sslVerifyCertificate=false to your connection string");
});