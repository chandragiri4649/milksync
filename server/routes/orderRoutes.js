const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { isAuthenticated, hasRole } = require("../middlewares/sessionMiddleware");

// Place order (Admin or Staff) - Temporarily disabled authentication for testing
router.post("/", (req, res, next) => {
  console.log('📦 Order creation - Authentication temporarily disabled:', {
    body: req.body
  });
  next();
}, orderController.createOrder);

// Get my orders (Admin or Staff) - Temporarily disabled authentication
router.get("/my-orders", orderController.getMyOrders);

// Get all orders (Admin or Staff) - main route - Temporarily disabled authentication
router.get("/", orderController.getAllOrders);

// Get all orders (Admin or Staff) - alternative route - Temporarily disabled authentication
router.get("/all", orderController.getAllOrders);

router.delete("/:id", orderController.deleteOrder);
router.put("/:id", orderController.updateOrder);

// Mark as delivered (credit wallet and lock) - Temporarily disabled authentication
router.post("/:id/deliver", orderController.markOrderDelivered);

router.get("/tomorrow", isAuthenticated, hasRole('distributor'), orderController.getTomorrowPendingOrders);

// Get all orders for distributor
router.get("/distributor/my-orders", isAuthenticated, hasRole('distributor'), orderController.getDistributorOrders);

// Confirm delivery by distributor
router.post("/:id/confirm-delivery", isAuthenticated, hasRole('distributor'), orderController.confirmDistributorDelivery);

module.exports = router;
