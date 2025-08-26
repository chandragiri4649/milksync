const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  company: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, enum: ["ml", "kg", "gm"], required: true },
  imageUrl: { type: String, required: true }, // path like "/uploads/filename.jpg"
  costPerTub: { type: Number, required: true }, // ADDED: Direct cost per tub
  costPerPacket: { type: Number, required: true }, // price of one packet
  packetsPerTub: { type: Number, required: true }  // number of packets in a tub
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);