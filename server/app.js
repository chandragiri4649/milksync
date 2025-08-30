require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const app = express();

// Import your route files
const adminRoutes = require("./routes/admin");
const staffRoutes = require("./routes/staff");
const distributorRoutes = require("./routes/distributor");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes"); 
const billsRoutes = require("./routes/billsRoutes");
const walletRoutes = require("./routes/walletRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");




// Enable Cross-Origin Resource Sharing for frontend requests
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
;

// Serve images statically with debugging
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Debug route to test file serving
app.get("/uploads/:filename", (req, res, next) => {
  console.log(`📁 File request: /uploads/${req.params.filename}`);
  console.log(`📂 Full path: ${path.join(__dirname, "uploads", req.params.filename)}`);
  next();
});

// Test endpoint to verify server is running
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is running", timestamp: new Date().toISOString() });
});

// Mount routers with distinct base paths
app.use("/api/admin", adminRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/distributor", distributorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bills", billsRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);



// Optional: error handling middleware
app.use((err, req, res, next) => {
  console.error("Error details:", err);
  
  // Handle multer errors specifically
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: "File too large", 
        message: "File size must be less than 5MB" 
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: "Unexpected file field", 
        message: "Please use 'image' as the field name for file upload" 
      });
    }
    return res.status(400).json({ 
      error: "File upload error", 
      message: err.message 
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: "Validation error", 
      message: err.message 
    });
  }
  
  // Handle other errors
  res.status(500).json({ 
    error: "Internal Server Error",
    message: process.env.NODE_ENV === 'development' ? err.message : "Something went wrong"
  });
});

module.exports = app;