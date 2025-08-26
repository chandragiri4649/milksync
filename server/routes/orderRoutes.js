const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authenticate = require("../middlewares/authMiddleware");
const adminOrStaff = require("../middlewares/adminOrStaffMiddleware");
const distributorOnly = require("../middlewares/distributorRoleMiddleware"); // ✅ use existing

// Place order (Admin or Staff)
router.post("/", authenticate, adminOrStaff, orderController.createOrder);

// Get my orders (Admin or Staff)
router.get("/my-orders", authenticate, adminOrStaff, orderController.getMyOrders);

// Get all orders (Admin or Staff) - main route
router.get("/", authenticate, adminOrStaff, orderController.getAllOrders);

// Get all orders (Admin or Staff) - alternative route
router.get("/all", authenticate, adminOrStaff, orderController.getAllOrders);

router.delete("/:id", authenticate, adminOrStaff, orderController.deleteOrder);
router.put("/:id", authenticate, adminOrStaff, orderController.updateOrder);

// Mark as delivered (credit wallet and lock)
router.post("/:id/deliver", authenticate, adminOrStaff, orderController.markOrderDelivered);

router.get("/tomorrow", authenticate, distributorOnly, orderController.getTomorrowPendingOrders);

// Get all orders for distributor
router.get("/distributor/my-orders", authenticate, distributorOnly, orderController.getDistributorOrders);

// Confirm delivery by distributor
router.post("/:id/confirm-delivery", authenticate, distributorOnly, orderController.confirmDistributorDelivery);

module.exports = router;
