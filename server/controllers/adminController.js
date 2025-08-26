const Admin = require("../models/Admin");
const ContactDetails = require("../models/ContactDetails");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendPasswordResetOTP, sendUsernameRecovery } = require("../services/emailService");

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

// Password Reset and Recovery Methods

/**
 * Request password reset - sends OTP to admin's email
 * POST /admin/request-reset
 * Body: { email: "admin@example.com" }
 */
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate email
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        message: "If the email exists, a password reset OTP has been sent" 
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP expiration (10 minutes from now)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Generate JWT reset token (15 minutes expiry)
    const resetToken = jwt.sign(
      { 
        adminId: admin._id, 
        email: admin.email,
        type: 'password_reset'
      },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "15m" }
    );

    // Save OTP and token to admin record
    admin.resetPasswordOTP = otp;
    admin.resetPasswordExpires = otpExpires;
    admin.resetPasswordToken = resetToken;
    await admin.save();

    // Send OTP email
    try {
      await sendPasswordResetOTP(admin.email, otp, admin.username);
      console.log(`Password reset OTP sent to ${admin.email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Clear the OTP if email fails
      admin.resetPasswordOTP = undefined;
      admin.resetPasswordExpires = undefined;
      admin.resetPasswordToken = undefined;
      await admin.save();
      
      return res.status(500).json({ 
        message: "Failed to send reset email. Please try again later." 
      });
    }

    res.status(200).json({ 
      message: "If the email exists, a password reset OTP has been sent",
      // In development, you might want to return the OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

/**
 * Reset password using OTP
 * POST /admin/reset-password
 * Body: { email: "admin@example.com", otp: "123456", newPassword: "newpass123" }
 */
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // Validate required fields
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        message: "Email, OTP, and new password are required" 
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or OTP" });
    }

    // Check if OTP exists and is not expired
    if (!admin.resetPasswordOTP || !admin.resetPasswordExpires) {
      return res.status(400).json({ message: "No valid reset request found" });
    }

    if (new Date() > admin.resetPasswordExpires) {
      // Clear expired OTP
      admin.resetPasswordOTP = undefined;
      admin.resetPasswordExpires = undefined;
      admin.resetPasswordToken = undefined;
      await admin.save();
      
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (admin.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset fields
    admin.password = hashedPassword;
    admin.resetPasswordOTP = undefined;
    admin.resetPasswordExpires = undefined;
    admin.resetPasswordToken = undefined;
    await admin.save();

    console.log(`Password reset successful for admin: ${admin.username}`);

    res.status(200).json({ 
      message: "Password reset successfully. You can now login with your new password." 
    });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

/**
 * Recover username by email
 * POST /admin/recover-username
 * Body: { email: "admin@example.com" }
 */
exports.recoverUsername = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate email
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        message: "If the email exists, username recovery information has been sent" 
      });
    }

    // Send username recovery email
    try {
      await sendUsernameRecovery(admin.email, admin.username);
      console.log(`Username recovery email sent to ${admin.email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ 
        message: "Failed to send recovery email. Please try again later." 
      });
    }

    res.status(200).json({ 
      message: "If the email exists, username recovery information has been sent" 
    });

  } catch (error) {
    console.error("Username recovery error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
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