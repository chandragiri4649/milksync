const express = require("express");
const router = express.Router();

const distributorController = require("../controllers/distributorController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminOrStaffMiddleware = require("../middlewares/adminOrStaffMiddleware");

// --- Public distributor login ---
router.post("/login", distributorController.distributorLogin);

// --- Protect all below ---
router.use(authMiddleware);

// --- Profile (self) ---
router.get("/profile", distributorController.getDistributorProfile);

router.get("/", adminOrStaffMiddleware, distributorController.getAllDistributors);




module.exports = router;
