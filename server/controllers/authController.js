const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

// Forgot Password - Send reset email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        message: 'If the email exists, a password reset link has been sent' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token expiration (15 minutes from now)
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Save token and expiration to admin record
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = resetTokenExpires;
    await admin.save();

    // Send reset email
    try {
      console.log(`📧 Sending password reset email to: ${admin.email}`);
      await sendPasswordResetEmail(admin.email, resetToken, admin.username);
      console.log(`✅ Password reset email sent successfully to ${admin.email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('❌ Email error details:', {
        message: emailError.message,
        stack: emailError.stack
      });
      
      // Clear the token if email fails
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpires = undefined;
      await admin.save();
      
      return res.status(500).json({ 
        message: `Failed to send reset email: ${emailError.message}`,
        error: process.env.NODE_ENV === 'development' ? emailError.message : 'Email service unavailable'
      });
    }

    res.status(200).json({ 
      message: 'If the email exists, a password reset link has been sent',
      // In development, you might want to return the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// Reset Password - Validate token (GET)
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Find admin with valid token
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    res.status(200).json({ 
      message: 'Token is valid',
      username: admin.username 
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// Reset Password - Update password (POST)
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validate required fields
    if (!newPassword) {
      return res.status(400).json({ 
        message: 'New password is required' 
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Find admin with valid token
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset fields
    admin.password = hashedPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    console.log(`Password reset successful for admin: ${admin.username}`);

    res.status(200).json({ 
      message: 'Password reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};
