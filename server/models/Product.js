const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  distributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Distributor', required: true },
  name: { type: String, required: true },
  productQuantity: { type: Number, required: true },
  productUnit: { type: String, enum: ["ml", "kg", "gm"], required: true },
  imageUrl: { type: String, required: true }, // path like "/uploads/filename.jpg"
  costPerTub: { type: Number, required: true }, // ADDED: Direct cost per tub
  costPerPacket: { type: Number, required: true }, // price of one packet
  packetsPerTub: { type: Number, required: true }  // number of packets in a tub
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);