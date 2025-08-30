const paymentService = require("../services/paymentService");
const Payment = require("../models/Payment");
const { cloudinary } = require("../config/cloudinary");

exports.createPayment = async (req, res) => {
  try {
    const { distributorId, amount, paymentMethod } = req.body;
    const receiptImageUrl = req.file ? req.file.path : null;

    if (!distributorId || !amount || !paymentMethod || !receiptImageUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userId = req.user._id; // authenticated user

    const payment = await paymentService.createPaymentAndUpdateWallet(
      distributorId,
      amount,
      paymentMethod,
      receiptImageUrl,
      userId
    );

    res.status(201).json({ message: "Payment recorded successfully", payment });
  } catch (err) {
    console.error("Payment creation error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Optional: Get Payments (admin/staff)
exports.getPayments = async (req, res) => {
  try {
    console.log("GET /payments - Starting query");
    
    const payments = await Payment.find()
      .populate("distributorId", "distributorName name")
      .populate("createdBy", "username name")
      .sort({ createdAt: -1 });

    console.log(`Successfully fetched ${payments.length} payments`);
    res.json(payments);
  } catch (err) {
    console.error("Error in getPayments:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ error: "Failed to fetch payments", details: err.message });
  }
};

// Get payments for a specific distributor (distributor view)
exports.getDistributorPayments = async (req, res) => {
  try {
    const distributorId = req.user.id;
    
    if (!distributorId) {
      return res.status(401).json({ error: "Distributor ID not found" });
    }

    console.log(`GET /payments/distributor - Fetching payments for distributor: ${distributorId}`);
    
    // Get payments for this specific distributor
    const payments = await Payment.find({ distributorId: distributorId })
      .populate("createdBy", "username name")
      .sort({ createdAt: -1 });

    console.log(`Successfully fetched ${payments.length} payments for distributor ${distributorId}`);
    res.json(payments);
  } catch (err) {
    console.error("Error fetching distributor payments:", err);
    res.status(500).json({ error: "Failed to fetch distributor payments", details: err.message });
  }
};
