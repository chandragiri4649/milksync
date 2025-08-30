const nodemailer = require('nodemailer');

// Email configuration using Gmail service
const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER || 'mounilaakutathi89@gmail.com',
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS || 'your-app-password'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter configuration
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, username) => {
  try {
    // Verify SMTP connection first
    const isVerified = await verifyTransporter();
    if (!isVerified) {
      throw new Error('SMTP connection verification failed');
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: `"MilkSync Admin" <${emailConfig.auth.user}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${username},</p>
          <p>You have requested to reset your password for the MilkSync Admin Dashboard.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 15 minutes.</strong></p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated message from MilkSync Admin Dashboard.</p>
        </div>
      `
    };

    console.log('📧 Attempting to send email to:', email);
    console.log('📧 From:', emailConfig.auth.user);
    console.log('📧 Reset URL:', resetUrl);

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);
    console.log('✅ Email accepted by:', info.accepted);
    console.log('✅ Email rejected by:', info.rejected);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode
    });
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

module.exports = {
  sendPasswordResetEmail
};
