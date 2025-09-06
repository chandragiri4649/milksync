const express = require("express");
const router = express.Router();

const distributorController = require("../controllers/distributorController");
const { isAuthenticated, hasRole } = require("../middlewares/sessionMiddleware");

// --- Public distributor login ---
router.post("/login", distributorController.distributorLogin);

// --- Public distributor logout ---
router.post("/logout", distributorController.distributorLogout);

// --- Public get distributor session info ---
router.get("/session-info", distributorController.getDistributorSessionInfo);

// --- Profile (self) ---
router.get("/profile", isAuthenticated, hasRole('distributor'), distributorController.getDistributorProfile);

router.get("/", isAuthenticated, hasRole(['admin', 'staff']), distributorController.getAllDistributors);




module.exports = router;
