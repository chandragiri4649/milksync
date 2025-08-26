const mongoose = require('mongoose');

const contactDetailsSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: true,
    trim: true
  },
  adminContact: {
    type: String,
    required: true,
    trim: true
  },
  adminEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  adminAddress: {
    type: String,
    required: true,
    trim: true
  },
  staffName: {
    type: String,
    required: true,
    trim: true
  },
  staffContact: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
contactDetailsSchema.index({ adminName: 1, staffName: 1 });

module.exports = mongoose.model('ContactDetails', contactDetailsSchema);

