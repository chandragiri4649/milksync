const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
});

const billSchema = new mongoose.Schema({
  distributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Distributor",
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },
  billNumber: { type: String, required: true, unique: true },
  billDate: { type: Date, default: Date.now },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  items: [billItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, default: 'pending' },
  // 🚫 Prevent generating/updating/deleting the bill after it's finalized
  locked: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model("Bill", billSchema);
