// routes/staff.js
const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const distributorController = require("../controllers/distributorController");
const { isAuthenticated, hasRole } = require("../middlewares/sessionMiddleware");

// Public: Staff login
router.post("/login", staffController.staffLogin);

// ✅ Protected: Get all distributors (staff must be logged in)
router.get(
  "/distributors",
  isAuthenticated, hasRole(['admin', 'staff']), // verifies session and role
  distributorController.getAllDistributors
);

module.exports = router;
