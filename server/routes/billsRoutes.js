const express = require("express");
const router = express.Router();
const {
    getBillsByDistributor,
    getDistributorBills,
    upsertBillFromOrder, // <-- use the new method
    createBill
} = require("../controllers/billsController");
const authenticate = require("../middlewares/authMiddleware");
const adminOrStaff = require("../middlewares/adminOrStaffMiddleware");
const distributorOnly = require("../middlewares/distributorRoleMiddleware");

// Get all bills (admin or staff)
router.get("/", authenticate, adminOrStaff, getBillsByDistributor);

// Get bills for distributor (distributor view)
router.get("/distributor", authenticate, distributorOnly, getDistributorBills);

// Create or Update bill from order (admin or staff)
router.post("/create", authenticate, adminOrStaff, upsertBillFromOrder);

// Create new bill (admin or staff)
router.post("/", authenticate, adminOrStaff, createBill);

module.exports = router;
