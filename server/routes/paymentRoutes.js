const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminOrStaffMiddleware = require("../middlewares/adminOrStaffMiddleware");
const distributorOnly = require("../middlewares/distributorRoleMiddleware");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // max 5MB

// Get all payments (admin/staff)
router.get("/", authMiddleware, adminOrStaffMiddleware, paymentController.getPayments);

// Get payments for distributor (distributor view)
router.get("/distributor", authMiddleware, distributorOnly, paymentController.getDistributorPayments);

// Create payment (upload receipt image)
router.post(
  "/create",
  authMiddleware,
  adminOrStaffMiddleware,
  upload.single("receiptImage"), // 'receiptImage' field from the form
  paymentController.createPayment
);

module.exports = router;
