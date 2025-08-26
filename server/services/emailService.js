const nodemailer = require('nodemailer');

/**
 * Email Service for Admin Password Reset
 * 
 * Recovery Steps Documentation:
 * 1. Admin requests password reset via POST /admin/request-reset
 * 2. System generates 6-digit OTP and JWT reset token
 * 3. OTP is sent to admin's registered email
 * 4. Admin enters OTP via POST /admin/reset-password
 * 5. System verifies OTP and allows new password setting
 * 6. Password is hashed with bcrypt before saving
 * 
 * Super Admin Recovery:
 * - Super Admin account (superadmin@domain.com) is always available
 * - Cannot be deleted or edited through normal admin management
 * - Can be used to recover access if all other admins are locked out
 */

// Email configuration - in production, use environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransporter(emailConfig);

/**
 * Send OTP email for password reset
 * @param {string} email - Admin's email address
 * @param {string} otp - 6-digit OTP
 * @param {string} username - Admin's username
 */
const sendPasswordResetOTP = async (email, otp, username) => {
  try {
    const mailOptions = {
      from: `"SVD MilkSync Admin" <${emailConfig.auth.user}>`,
      to: email,
      subject: 'Password Reset - SVD MilkSync Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${username},</p>
          <p>You have requested to reset your password for the SVD MilkSync Admin account.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; margin: 0;">Your OTP Code:</h3>
            <h1 style="color: #28a745; font-size: 32px; margin: 10px 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP is valid for 10 minutes only</li>
            <li>Do not share this code with anyone</li>
            <li>If you didn't request this reset, please ignore this email</li>
          </ul>
          
          <p>If you need assistance, please contact your system administrator.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from SVD MilkSync Admin System.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset OTP sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send username recovery email
 * @param {string} email - Admin's email address
 * @param {string} username - Admin's username
 */
const sendUsernameRecovery = async (email, username) => {
  try {
    const mailOptions = {
      from: `"SVD MilkSync Admin" <${emailConfig.auth.user}>`,
      to: email,
      subject: 'Username Recovery - SVD MilkSync Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Username Recovery</h2>
          <p>Hello,</p>
          <p>You have requested to recover your username for the SVD MilkSync Admin account.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; margin: 0;">Your Username:</h3>
            <h2 style="color: #28a745; margin: 10px 0;">${username}</h2>
          </div>
          
          <p><strong>Security Note:</strong></p>
          <ul>
            <li>Keep your username secure and do not share it</li>
            <li>If you didn't request this recovery, please contact your system administrator</li>
            <li>Use the password reset feature if you've forgotten your password</li>
          </ul>
          
          <p>If you need assistance, please contact your system administrator.</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from SVD MilkSync Admin System.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Username recovery email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending username recovery email:', error);
    throw new Error('Failed to send username recovery email');
  }
};

/**
 * Test email configuration
 */
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetOTP,
  sendUsernameRecovery,
  testEmailConfig
};
