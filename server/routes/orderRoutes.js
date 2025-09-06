const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { isAuthenticated, hasRole, getCurrentUser } = require("../middlewares/sessionMiddleware");

// Place order (Admin or Staff) - Re-enabled authentication
router.post("/", isAuthenticated, hasRole(['admin', 'staff']), getCurrentUser, orderController.createOrder);

// Get my orders (Admin or Staff) - Re-enabled authentication
router.get("/my-orders", isAuthenticated, hasRole(['admin', 'staff']), getCurrentUser, orderController.getMyOrders);

// Get all orders (Admin or Staff) - main route - Re-enabled authentication
router.get("/", isAuthenticated, hasRole(['admin', 'staff']), getCurrentUser, orderController.getAllOrders);

// Get all orders (Admin or Staff) - alternative route - Re-enabled authentication
router.get("/all", isAuthenticated, hasRole(['admin', 'staff']), getCurrentUser, orderController.getAllOrders);

router.delete("/:id", isAuthenticated, hasRole(['admin', 'staff']), getCurrentUser, orderController.deleteOrder);
router.put("/:id", isAuthenticated, hasRole(['admin', 'staff']), getCurrentUser, orderController.updateOrder);

// Mark as delivered (credit wallet and lock) - Re-enabled authentication
router.post("/:id/deliver", isAuthenticated, hasRole(['admin', 'staff']), getCurrentUser, orderController.markOrderDelivered);

router.get("/tomorrow", isAuthenticated, hasRole(['distributor']), orderController.getTomorrowPendingOrders);

// Get all orders for distributor
router.get("/distributor/my-orders", isAuthenticated, hasRole(['distributor']), orderController.getDistributorOrders);

// Confirm delivery by distributor
router.post("/:id/confirm-delivery", isAuthenticated, hasRole(['distributor']), orderController.confirmDistributorDelivery);

module.exports = router;
