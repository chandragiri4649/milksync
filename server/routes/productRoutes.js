const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const { isAuthenticated, hasRole } = require("../middlewares/sessionMiddleware");
const { upload, handleUploadError } = require("../middlewares/cloudinaryUpload");

// Get products (admin or staff)
router.get("/", isAuthenticated, hasRole(['admin', 'staff']), productController.getProducts);

// Create product (admin only) with image upload
router.post("/", isAuthenticated, hasRole('admin'), upload.single("image"), handleUploadError, productController.createProductWithImage);

// Update product (admin only) with optional image upload
router.put("/:id", isAuthenticated, hasRole('admin'), upload.single("image"), handleUploadError, productController.updateProductWithImage);

// Delete product (admin only)
router.delete("/:id", isAuthenticated, hasRole('admin'), productController.deleteProduct);

router.get("/company/:companyName", isAuthenticated, hasRole(['admin', 'staff']), productController.getProductsByCompany);

module.exports = router;
