// routes/walletRoutes.js

const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const { isAuthenticated, hasRole } = require("../middlewares/sessionMiddleware");

// ✅ NEW: Get wallet balance for the logged-in distributor
router.get("/me", isAuthenticated, hasRole('distributor'), (req, res, next) => {
  req.params.distributorId = req.user._id || req.user.id; // logged-in distributor's own ID
  return walletController.getWallet(req, res, next);
});


// Get wallet balance
router.get("/:distributorId", isAuthenticated, hasRole(['admin', 'staff']), walletController.getWallet);

// Manually credit wallet
router.post("/:distributorId/credit", isAuthenticated, hasRole(['admin', 'staff']), walletController.creditWallet);

// Manually debit wallet
router.post("/:distributorId/debit", isAuthenticated, hasRole(['admin', 'staff']), walletController.debitWallet);

module.exports = router;
