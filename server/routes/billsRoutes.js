const express = require("express");
const router = express.Router();
const {
    getBillsByDistributor,
    getDistributorBills,
    upsertBillFromOrder, // <-- use the new method
    createBill
} = require("../controllers/billsController");
const { isAuthenticated, hasRole } = require("../middlewares/sessionMiddleware");

// Get all bills (admin or staff)
router.get("/", isAuthenticated, hasRole(['admin', 'staff']), getBillsByDistributor);

// Get bills for distributor (distributor view)
router.get("/distributor", isAuthenticated, hasRole('distributor'), getDistributorBills);

// Create or Update bill from order (admin or staff)
router.post("/create", isAuthenticated, hasRole(['admin', 'staff']), upsertBillFromOrder);

// Create new bill (admin or staff)
router.post("/", isAuthenticated, hasRole(['admin', 'staff']), createBill);

module.exports = router;
