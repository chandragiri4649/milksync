const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminOrStaffMiddleware = require("../middlewares/adminOrStaffMiddleware");
const distributorOnly = require("../middlewares/distributorRoleMiddleware");
const { upload, handleUploadError } = require("../middlewares/cloudinaryUpload");

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
  handleUploadError,
  paymentController.createPayment
);

module.exports = router;
