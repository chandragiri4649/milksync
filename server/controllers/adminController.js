const Admin = require("../models/Admin");
const ContactDetails = require("../models/ContactDetails");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find admin by username
    const admin = await Admin.findOne({ username });
    if (!admin) {
      // Admin not found — send generic message
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare given password with hashed password stored
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      // Password mismatch
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Create JWT token with payload and expiration
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: "admin",
      },
      process.env.JWT_SECRET || "your_jwt_secret", // Use environment variable in production
      {
        expiresIn: "2h", // Token valid for 2 hours
      }
    );

    // Send success response with token
    return res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    // Internal server error
    return res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Contact Details Management Methods

// Get all contact details
exports.getContactDetails = async (req, res) => {
  try {
    const contactDetails = await ContactDetails.find().sort({ createdAt: -1 });
    res.json(contactDetails);
  } catch (error) {
    console.error("Error fetching contact details:", error);
    res.status(500).json({ message: "Failed to fetch contact details" });
  }
};

// Add new contact details
exports.addContactDetails = async (req, res) => {
  try {
    const { adminName, adminContact, adminEmail, adminAddress, staffName, staffContact } = req.body;

    // Validate required fields
    if (!adminName || !adminContact || !adminEmail || !adminAddress || !staffName || !staffContact) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Create new contact details
    const newContactDetails = new ContactDetails({
      adminName,
      adminContact,
      adminEmail,
      adminAddress,
      staffName,
      staffContact
    });

    const savedContactDetails = await newContactDetails.save();
    res.status(201).json(savedContactDetails);
  } catch (error) {
    console.error("Error adding contact details:", error);
    res.status(500).json({ message: "Failed to add contact details" });
  }
};

// Update contact details
exports.updateContactDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminName, adminContact, adminEmail, adminAddress, staffName, staffContact } = req.body;

    // Validate required fields
    if (!adminName || !adminContact || !adminEmail || !adminAddress || !staffName || !staffContact) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find and update contact details
    const updatedContactDetails = await ContactDetails.findByIdAndUpdate(
      id,
      {
        adminName,
        adminContact,
        adminEmail,
        adminAddress,
        staffName,
        staffContact
      },
      { new: true, runValidators: true }
    );

    if (!updatedContactDetails) {
      return res.status(404).json({ message: "Contact details not found" });
    }

    res.json(updatedContactDetails);
  } catch (error) {
    console.error("Error updating contact details:", error);
    res.status(500).json({ message: "Failed to update contact details" });
  }
};

// Delete contact details
exports.deleteContactDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedContactDetails = await ContactDetails.findByIdAndDelete(id);

    if (!deletedContactDetails) {
      return res.status(404).json({ message: "Contact details not found" });
    }

    res.json({ message: "Contact details deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact details:", error);
    res.status(500).json({ message: "Failed to delete contact details" });
  }
};