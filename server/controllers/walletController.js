// controllers/walletController.js

const walletService = require("../services/walletService");

exports.getWallet = async (req, res) => {
  try {
    console.log("🔍 walletController - getWallet called with distributor ID:", req.params.distributorId);
    const balance = await walletService.getWalletBalance(req.params.distributorId);
    console.log("✅ walletController - Wallet balance retrieved:", balance);
    res.json({ walletBalance: balance });
  } catch (err) {
    console.error("❌ walletController - Error getting wallet balance:", err.message);
    res.status(400).json({ error: err.message });
  }
};

exports.creditWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const balance = await walletService.creditWallet(req.params.distributorId, amount);
    res.json({ message: "Wallet credited", walletBalance: balance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.debitWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const balance = await walletService.debitWallet(req.params.distributorId, amount);
    res.json({ message: "Wallet debited", walletBalance: balance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
