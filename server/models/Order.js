const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'userModel' // Dynamic reference to either Admin or Staff
  },
  userModel: { 
    type: String, 
    required: true, 
    enum: ['Admin', 'Staff'] // Can only reference Admin or Staff models
  },
  distributorId: { type: mongoose.Schema.Types.ObjectId, ref: "Distributor", required: true },
  customerName: { type: String, default: "Customer" }, // Customer name for quick access
  orderDate: { type: Date, required: true },
  status: { type: String, default: "pending" },
  locked: { type: Boolean, default: false }, // 🚫 Prevent changes when true
  deliveryDate: { type: Date }, // When order was delivered
  distributorNotes: { type: String }, // Notes from distributor about delivery

  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true } // tub, bucket, etc.
    }
  ],
  damagedProducts: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      productName: { type: String },
      quantity: { type: Number, default: 0 }, // Quantity in PACKETS
      unit: { type: String, default: 'packets' }, // Always 'packets' for damaged products
      price: { type: Number, default: 0 }, // Price per packet
      totalCost: { type: Number, default: 0 } // Total cost for damaged packets
    }
  ],
  totalDamagedCost: { type: Number, default: 0 }, // Total cost of all damaged packets
  finalBillAmount: { type: Number, default: 0 }, // Final bill amount after damaged products deduction
  updatedBy: {
    role: { type: String, enum: ['admin', 'staff'], default: 'admin' },
    id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String }
  },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
