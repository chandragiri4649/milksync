const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true }
});

const damagedProductSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true }, // Quantity in PACKETS
  unit: { type: String, default: 'packets' }, // Always 'packets' for damaged products
  price: { type: Number, required: true }, // Price per packet
  total: { type: Number, required: true } // Total cost for damaged packets
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
  damagedProducts: [damagedProductSchema], // Damaged products with their costs (in packets)
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalDamagedCost: { type: Number, default: 0 }, // Total cost of damaged products
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, default: 'pending' },
  // 🚫 Prevent generating/updating/deleting the bill after it's finalized
  locked: { type: Boolean, default: false },
  updatedBy: {
    role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
    id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String }
  },
  updatedAt: { type: Date, default: Date.now }

}, { timestamps: true });

module.exports = mongoose.model("Bill", billSchema);
