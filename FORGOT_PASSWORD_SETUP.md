# Forgot Password Functionality - Setup Guide

## 🎯 Overview
Complete forgot password functionality has been implemented for the Admin dashboard with secure token-based password reset via email.

## 📁 Files Created/Modified

### Backend Files
- `server/models/Admin.js` - Updated schema with email, resetPasswordToken, resetPasswordExpires
- `server/controllers/authController.js` - New controller for password reset logic
- `server/routes/authRoutes.js` - New routes for password reset endpoints
- `server/services/emailService.js` - Email service using Nodemailer
- `server/app.js` - Added auth routes
- `server/.env` - Added email configuration

### Frontend Files
- `client/src/components/ForgotPassword.jsx` - Forgot password form
- `client/src/components/ResetPassword.jsx` - Reset password form
- `client/src/components/AdminLogin.jsx` - Added "Forgot Password?" link
- `client/src/App.js` - Added password reset routes

## 🔧 API Endpoints

### 1. POST `/api/auth/forgot-password`
**Purpose**: Send password reset email
**Body**: `{ "email": "admin@example.com" }`
**Response**: `{ "message": "If the email exists, a password reset link has been sent" }`

### 2. GET `/api/auth/reset-password/:token`
**Purpose**: Validate reset token
**Response**: `{ "message": "Token is valid", "username": "Admin1" }`

### 3. POST `/api/auth/reset-password/:token`
**Purpose**: Reset password with new password
**Body**: `{ "newPassword": "newpassword123" }`
**Response**: `{ "message": "Password reset successfully" }`

## ⚙️ Environment Configuration

Update your `server/.env` file with email settings:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/milksync
JWT_SECRET=your_jwt_secret
PORT=5000

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (Gmail Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📧 Email Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

3. **Update .env file**:
   ```env
   SMTP_USER=your-actual-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

## 🚀 How to Use

### 1. Admin Login
- Go to `/admin/login`
- Click "Forgot Password?" link

### 2. Forgot Password
- Enter admin email address
- Click "Send Reset Link"
- Check email for reset link

### 3. Reset Password
- Click link in email (expires in 15 minutes)
- Enter new password (minimum 6 characters)
- Confirm new password
- Click "Reset Password"
- Redirected to login with success message

## 🔐 Security Features

- **Token Expiration**: Reset tokens expire in 15 minutes
- **One-time Use**: Tokens are cleared after successful reset
- **Secure Generation**: Uses `crypto.randomBytes(32).toString("hex")`
- **Password Hashing**: New passwords are hashed with bcrypt
- **Email Validation**: Generic messages prevent email enumeration
- **Token Validation**: Server validates token before allowing reset

## 🧪 Testing

### Test the Flow:
1. **Start server**: `npm start` (in server directory)
2. **Start client**: `npm start` (in client directory)
3. **Go to**: `http://localhost:3000/admin/login`
4. **Click**: "Forgot Password?"
5. **Enter email**: `admin1@milksync.com`
6. **Check email** for reset link
7. **Click link** and reset password

### Development Testing:
In development mode, the reset token is returned in the API response for testing purposes.

## 📝 Current Admin Account

**Username**: `Admin1`
**Email**: `admin1@milksync.com`
**Password**: (your original password)

## 🔄 Database Schema

The Admin model now includes:
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required),
  resetPasswordToken: String (optional),
  resetPasswordExpires: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## 🛠️ Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env`
2. Verify Gmail app password
3. Check server logs for email errors
4. Ensure 2FA is enabled on Gmail

### Token Invalid/Expired
1. Tokens expire in 15 minutes
2. Tokens are single-use only
3. Check server time synchronization

### Frontend Issues
1. Ensure routes are properly configured in `App.js`
2. Check browser console for errors
3. Verify API endpoints are accessible

## 🎉 Success!

The forgot password functionality is now fully implemented and ready to use! Admins can securely reset their passwords via email with proper token validation and expiration.
