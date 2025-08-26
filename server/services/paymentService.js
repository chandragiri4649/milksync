const Payment = require("../models/Payment");
const Distributor = require("../models/Distributor");

exports.createPaymentAndUpdateWallet = async (distributorId, amount, paymentMethod, receiptImageUrl, userId) => {
  if (amount <= 0) throw new Error("Payment amount must be positive");

  const distributor = await Distributor.findById(distributorId);
  if (!distributor) throw new Error("Distributor not found");

  if (distributor.walletBalance < amount) throw new Error("Insufficient wallet balance");

  // Create payment record
  const payment = new Payment({
    distributorId,
    amount,
    paymentMethod,
    receiptImageUrl,
    createdBy: userId,
  });

  // Deduct amount from wallet
  distributor.walletBalance -= amount;

  await Promise.all([payment.save(), distributor.save()]);

  return payment;
};
