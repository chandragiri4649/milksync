# SVD MilkSync Deployment Guide

## 🚀 Pre-Deployment Checklist

### ✅ Security Fixes Applied
- [x] Fixed hardcoded session secrets
- [x] Configured environment-aware CORS
- [x] Secured SSL bypass for production
- [x] Made cookie settings production-ready
- [x] Secured debug endpoints (development only)

## 📋 Required Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

### Required for Production
```env
# Node Environment
NODE_ENV=production

# Security Secrets (Generate strong random keys)
SESSION_SECRET=your-super-secure-session-secret-here
JWT_SECRET=your-super-secure-jwt-secret-here

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/milksync

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com
```

### Optional Services
```env
# Cloudinary (for image uploads)
CLOUD_NAME=your-cloudinary-cloud-name
CLOUD_API_KEY=your-cloudinary-api-key
CLOUD_API_SECRET=your-cloudinary-api-secret

# Email Service (for password reset)
EMAIL_SERVICE_HOST=smtp.your-email-provider.com
EMAIL_SERVICE_PORT=587
EMAIL_SERVICE_USER=your-email@domain.com
EMAIL_SERVICE_PASS=your-email-password

# Server Port (optional, defaults to 5000)
PORT=5000
```

### Client Environment Variables
Create a `.env` file in the `client/` directory:
```env
REACT_APP_SERVER_URL=https://api.your-domain.com
```

## 🔐 Generate Secure Secrets

Run these commands to generate secure secrets:

```bash
# Generate SESSION_SECRET
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET  
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

## 🌐 Deployment Steps

### 1. Server Deployment
```bash
cd server
npm install --production
npm run seed:admin  # Create initial admin user
NODE_ENV=production npm start
```

### 2. Client Deployment
```bash
cd client
npm install
npm run build
# Deploy build/ folder to your hosting service
```

## 🔒 Security Verification

After deployment, verify:

1. **HTTPS is enabled** - All traffic should use SSL
2. **CORS is restricted** - Only your frontend domain is allowed
3. **Debug endpoints are disabled** - `/api/session-test` returns 404 in production
4. **Strong secrets are used** - No default/weak secrets in production
5. **Database is secure** - Production database with proper authentication

## 📊 Health Check Endpoints

- `GET /api/test` - Basic server health check
- Development only:
  - `GET /api/session-test` - Session functionality test
  - `GET /api/debug-headers` - Request debugging

## ⚠️ Important Notes

1. **Never commit `.env` files** to version control
2. **Use separate databases** for development and production
3. **Enable MongoDB Atlas IP whitelist** for production
4. **Set up SSL certificates** for HTTPS
5. **Monitor logs** for any security issues

## 🎯 Ready for Master Merge

The codebase is now production-ready with:
- ✅ Security vulnerabilities fixed
- ✅ Environment-aware configurations
- ✅ Production-safe defaults
- ✅ Proper error handling
- ✅ Clean separation of development/production features

You can safely merge to master after setting up the required environment variables.
