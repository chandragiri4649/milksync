const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { isAuthenticated, hasRole } = require("../middlewares/sessionMiddleware");
const { upload, handleUploadError } = require("../middlewares/cloudinaryUpload");

// Get all payments (admin/staff)
router.get("/", isAuthenticated, hasRole(['admin', 'staff']), paymentController.getPayments);

// Get payments for distributor (distributor view)
router.get("/distributor", isAuthenticated, hasRole('distributor'), paymentController.getDistributorPayments);

// Create payment (upload receipt image)
router.post(
  "/create",
  isAuthenticated,
  hasRole(['admin', 'staff']),
  upload.single("receiptImage"), // 'receiptImage' field from the form
  handleUploadError,
  paymentController.createPayment
);

module.exports = router;
