// routes/walletRoutes.js

const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");
const authenticate = require("../middlewares/authMiddleware");
const adminOrStaff = require("../middlewares/adminOrStaffMiddleware");

// ✅ NEW: Get wallet balance for the logged-in distributor
router.get("/me", authenticate, (req, res, next) => {
  if (req.user.role !== "distributor") {
    return res.status(403).json({ message: "Access denied" });
  }
  req.params.distributorId = req.user._id || req.user.id; // logged-in distributor's own ID
  return walletController.getWallet(req, res, next);
});


// Get wallet balance
router.get("/:distributorId", authenticate, adminOrStaff, walletController.getWallet);

// Manually credit wallet
router.post("/:distributorId/credit", authenticate, adminOrStaff, walletController.creditWallet);

// Manually debit wallet
router.post("/:distributorId/debit", authenticate, adminOrStaff, walletController.debitWallet);

module.exports = router;
