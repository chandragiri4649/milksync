const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const staffController = require("../controllers/staffController");
const distributorController = require("../controllers/distributorController");

const { isAuthenticated, hasRole, getCurrentUser } = require("../middlewares/sessionMiddleware");

// --- Public admin routes ---
router.post("/login", adminController.login);
router.post("/logout", adminController.logout);
router.get("/session", adminController.getSessionInfo);

// --- Protect all below as admin-only ---
router.use(isAuthenticated, hasRole('admin'));

// --- Staff management ---
router.get("/staff", staffController.getAllStaff);
router.post("/staff", staffController.addStaff);
router.put("/staff/:id", staffController.updateStaff);
router.delete("/staff/:id", staffController.deleteStaff);

// Debug route to test if PUT is working
router.put("/test", (req, res) => {
  res.json({ message: "PUT route is working" });
});

// --- Distributor management ---
router.get("/distributors", distributorController.getAllDistributors);
router.get("/distributors/:id/full-data", distributorController.getDistributorFullData);
router.post("/distributors", distributorController.addDistributor);
router.put("/distributors/:id", distributorController.updateDistributor);
router.delete("/distributors/:id", distributorController.deleteDistributor);

// --- Contact Details management ---
router.get("/contact-details", adminController.getContactDetails);
router.post("/contact-details", adminController.addContactDetails);
router.put("/contact-details/:id", adminController.updateContactDetails);
router.delete("/contact-details/:id", adminController.deleteContactDetails);

module.exports = router;
