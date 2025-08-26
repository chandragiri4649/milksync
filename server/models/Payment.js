const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  distributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Distributor",
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ["PhonePe", "Google Pay", "Cash", "Net Banking", "Bank Transfer"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  receiptImageUrl: {
    type: String, // file path or URL
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin", // Reference Admin model
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
