const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  email: { type: String, required: false },
  phone: { type: String, required: false },
  imageUrl: { type: String, required: false }, // URL to staff profile image
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Staff", staffSchema);