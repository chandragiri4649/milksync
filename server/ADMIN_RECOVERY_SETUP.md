# Admin Password Recovery Setup Guide

## Overview
This guide explains how to set up and use the Admin password recovery functionality in SVD MilkSync.

## Features Implemented

### 1. Super Admin Account
- **Default Super Admin**: `superadmin@domain.com`
- **Username**: `superadmin`
- **Default Password**: `SuperAdmin@2024`
- **Purpose**: Emergency recovery when all other admins are locked out
- **Protection**: Cannot be deleted or edited through normal admin management

### 2. Forgot Password Flow
- **Step 1**: Admin requests password reset via email
- **Step 2**: System sends 6-digit OTP to registered email
- **Step 3**: Admin enters OTP and new password
- **Step 4**: Password is updated securely

### 3. Username Recovery
- Admin can recover username by providing registered email
- Username is sent to the registered email address

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the server directory with:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/svdmilksync

# JWT Secret (use a strong secret in production)
JWT_SECRET=your_jwt_secret_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Environment
NODE_ENV=development
```

### 2. Email Configuration
For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `SMTP_PASS`

### 3. Create Super Admin
Run the setup script:
```bash
node setupSuperAdmin.js
```

## API Endpoints

### Public Routes (No Authentication Required)

#### 1. Request Password Reset
```
POST /admin/request-reset
Content-Type: application/json

{
  "email": "admin@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a password reset OTP has been sent"
}
```

#### 2. Reset Password
```
POST /admin/reset-password
Content-Type: application/json

{
  "email": "admin@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully. You can now login with your new password."
}
```

#### 3. Recover Username
```
POST /admin/recover-username
Content-Type: application/json

{
  "email": "admin@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, username recovery information has been sent"
}
```

## Security Features

### 1. OTP Security
- 6-digit numeric OTP
- 10-minute expiration
- Single-use (cleared after successful reset)
- Cryptographically secure random generation

### 2. JWT Token Security
- 15-minute expiration for reset tokens
- Signed with JWT secret
- Contains admin ID and email for verification

### 3. Password Security
- Minimum 6 characters required
- Hashed with bcrypt (10 salt rounds)
- Old password is completely replaced

### 4. Email Security
- Generic responses (don't reveal if email exists)
- Professional email templates
- Clear security instructions

## Recovery Scenarios

### Scenario 1: Admin Forgets Password
1. Go to admin login page
2. Click "Forgot Password"
3. Enter registered email
4. Check email for OTP
5. Enter OTP and new password
6. Login with new credentials

### Scenario 2: Admin Forgets Username
1. Go to admin login page
2. Click "Forgot Username"
3. Enter registered email
4. Check email for username
5. Use username to login

### Scenario 3: All Admins Locked Out
1. Use Super Admin credentials:
   - Username: `superadmin`
   - Password: `SuperAdmin@2024`
2. Create new admin accounts
3. Reset other admin passwords
4. Change Super Admin password

## Database Schema Changes

### Admin Model Updates
```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  password: String (required), // Hashed
  isSuperAdmin: Boolean (default: false),
  resetPasswordOTP: String, // 6-digit OTP
  resetPasswordExpires: Date, // OTP expiration
  resetPasswordToken: String, // JWT reset token
  createdAt: Date,
  updatedAt: Date
}
```

## Testing

### Development Mode
In development mode (`NODE_ENV=development`), the OTP is returned in the API response for testing purposes.

### Production Mode
In production mode, OTPs are only sent via email for security.

## Troubleshooting

### Email Not Sending
1. Check SMTP configuration
2. Verify email credentials
3. Check firewall/network settings
4. Test with `testEmailConfig()` function

### OTP Not Working
1. Check if OTP has expired (10 minutes)
2. Verify OTP format (6 digits)
3. Check server logs for errors
4. Ensure email matches exactly

### Super Admin Access Issues
1. Run `node setupSuperAdmin.js` again
2. Check database connection
3. Verify default credentials
4. Check for duplicate Super Admin accounts

## Maintenance

### Regular Tasks
1. Monitor email delivery logs
2. Review failed login attempts
3. Update Super Admin password periodically
4. Backup admin accounts

### Security Updates
1. Rotate JWT secrets regularly
2. Update email templates
3. Review OTP expiration times
4. Monitor for suspicious activity

## Support

For technical support or issues:
1. Check server logs
2. Verify environment configuration
3. Test email connectivity
4. Contact system administrator
