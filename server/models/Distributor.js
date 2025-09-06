const mongoose = require("mongoose");

const distributorSchema = new mongoose.Schema({
  distributorName: { type: String, required: true },
  companyName: { type: String, required: true },
  contact: { type: String },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'pending' }, // Status field
  walletBalance: { type: Number, default: 0 }, // 💰 WALLET
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Distributor", distributorSchema);