require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

// Import session configuration
const { sessionMiddleware, cookieMiddleware } = require("./config/session");

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
const sessionRoutes = require("./routes/sessionRoutes");




// Enable Cross-Origin Resource Sharing for frontend requests
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, be more restrictive
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        // Add your specific Render frontend URL
        'https://milksyncweb.onrender.com'
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        console.log('✅ CORS allowed origin:', origin);
        return callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        console.log('❌ Allowed origins:', allowedOrigins);
        return callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow localhost origins
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true);
    }
    
    // Also allow localhost in production for development testing
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      console.log('✅ CORS allowing localhost for development:', origin);
      return callback(null, true);
    }
  },
  credentials: true, // Allow cookies to be sent with requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Session and cookie middleware (must come before other middleware)
app.use(cookieMiddleware);
app.use(sessionMiddleware);

// Middleware to parse incoming JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Development-only debug endpoints
if (process.env.NODE_ENV !== 'production') {
  // Test endpoint to verify session is working
  app.get("/api/session-test", (req, res) => {
    console.log('🔍 Session test - Session object:', req.session);
    console.log('🔍 Session test - Cookies:', req.headers.cookie);
    
    if (req.session && req.session.userId) {
      res.json({ 
        message: "Session is working", 
        session: {
          userId: req.session.userId,
          userRole: req.session.userRole,
          username: req.session.username
        }
      });
    } else {
      res.json({ 
        message: "No active session", 
        session: req.session,
        cookies: req.headers.cookie ? 'Present' : 'Missing'
      });
    }
  });

  // Test endpoint to create a simple session
  app.get("/api/create-test-session", (req, res) => {
    req.session.testData = {
      userId: 'test-user-123',
      userRole: 'test',
      username: 'testuser',
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Test session created:', req.session);
    
    res.json({ 
      message: "Test session created", 
      sessionId: req.session.id,
      sessionData: req.session.testData
    });
  });

  // Debug endpoint to show all request headers and cookies
  app.get("/api/debug-headers", (req, res) => {
    console.log('🔍 Debug headers - All request headers:', req.headers);
    console.log('🔍 Debug headers - Session object:', req.session);
    
    res.json({
      message: "Debug info",
      headers: req.headers,
      cookies: req.headers.cookie || 'No cookies',
      session: req.session || 'No session',
      sessionId: req.session?.id || 'No session ID'
    });
  });
}

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
app.use("/api", sessionRoutes);



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