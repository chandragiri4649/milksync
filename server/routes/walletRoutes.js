// routes/walletRoutes.js

const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const { isAuthenticated, hasRole } = require("../middlewares/sessionMiddleware");

// ✅ NEW: Get wallet balance for the logged-in distributor
router.get("/me", isAuthenticated, hasRole(['distributor']), (req, res, next) => {
  console.log("🔍 walletRoutes - /me endpoint called");
  console.log("🔍 walletRoutes - Session data:", {
    userId: req.session.userId,
    userRole: req.session.userRole,
    username: req.session.username
  });
  
  // Use the session user ID
  req.params.distributorId = req.session.userId;
  console.log("🔍 walletRoutes - Using distributor ID:", req.params.distributorId);
  
  return walletController.getWallet(req, res, next);
});


// Get wallet balance
router.get("/:distributorId", isAuthenticated, hasRole(['admin', 'staff']), walletController.getWallet);

// Manually credit wallet
router.post("/:distributorId/credit", isAuthenticated, hasRole(['admin', 'staff']), walletController.creditWallet);

// Manually debit wallet
router.post("/:distributorId/debit", isAuthenticated, hasRole(['admin', 'staff']), walletController.debitWallet);

module.exports = router;
