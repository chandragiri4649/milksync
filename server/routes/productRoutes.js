const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const authenticate = require("../middlewares/authMiddleware");
const isAdmin = require("../middlewares/adminRoleMiddleware");
const adminOrStaff = require("../middlewares/adminOrStaffMiddleware");
const { upload } = require("../middlewares/upload");

// Get products (admin or staff)
router.get("/", authenticate, adminOrStaff, productController.getProducts);

// Create product (admin only) with image upload
router.post("/", authenticate, isAdmin, upload.single("image"), productController.createProductWithImage);

// Update product (admin only) with optional image upload
router.put("/:id", authenticate, isAdmin, upload.single("image"), productController.updateProductWithImage);

// Delete product (admin only)
router.delete("/:id", authenticate, isAdmin, productController.deleteProduct);

router.get("/company/:companyName", authenticate, adminOrStaff, productController.getProductsByCompany);

module.exports = router;
