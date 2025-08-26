const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password
  isSuperAdmin: { type: Boolean, default: false }, // Super admin cannot be deleted/edited
  resetPasswordOTP: { type: String }, // 6-digit OTP for password reset
  resetPasswordExpires: { type: Date }, // OTP expiration time
  resetPasswordToken: { type: String }, // JWT token for password reset
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);