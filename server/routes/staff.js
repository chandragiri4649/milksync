// routes/staff.js
const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const distributorController = require("../controllers/distributorController");
const authenticate = require("../middlewares/authMiddleware");

// Public: Staff login
router.post("/login", staffController.staffLogin);

// ✅ Protected: Get all distributors (staff must be logged in)
router.get(
  "/distributors",
  authenticate, // verifies staffToken or adminToken
  distributorController.getAllDistributors
);

module.exports = router;
