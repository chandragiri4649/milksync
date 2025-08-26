// services/walletService.js

const Distributor = require("../models/Distributor");

exports.creditWallet = async (distributorId, amount) => {
  if (amount <= 0) throw new Error("Credit amount must be positive");
  
  const distributor = await Distributor.findById(distributorId);
  if (!distributor) throw new Error("Distributor not found");

  distributor.walletBalance += amount;
  await distributor.save();

  return distributor.walletBalance;
};

exports.debitWallet = async (distributorId, amount) => {
  if (amount <= 0) throw new Error("Debit amount must be positive");

  const distributor = await Distributor.findById(distributorId);
  if (!distributor) throw new Error("Distributor not found");

  if (distributor.walletBalance < amount) throw new Error("Insufficient funds");

  distributor.walletBalance -= amount;
  await distributor.save();

  return distributor.walletBalance;
};

exports.getWalletBalance = async (distributorId) => {
  const distributor = await Distributor.findById(distributorId);
  if (!distributor) throw new Error("Distributor not found");
  return distributor.walletBalance;
};
