# Environment Variables Setup for Deployment

## 🚨 Critical: Data Fetching Issues Fix

Your deployed application is not fetching data because environment variables are missing.

## 📋 Required Environment Variables

### Client Environment Variables
Create `client/.env` file:
```env
REACT_APP_SERVER_URL=https://your-deployed-server-url.com
```

### Server Environment Variables  
Create `server/.env` file:
```env
# Production Environment
NODE_ENV=production
PORT=5000

# Database Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/milksync

# CORS Configuration - CRITICAL for data fetching
FRONTEND_URL=https://your-deployed-client-url.com

# Session Security
SESSION_SECRET=your-very-secure-secret-key-here-minimum-32-characters

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Configuration (optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🔧 Platform-Specific Setup

### For Vercel:
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add each variable above

### For Netlify:
1. Site Settings → Environment Variables
2. Add each variable above

### For Heroku:
1. Settings → Config Vars
2. Add each variable above

### For Railway/Render:
1. Environment Variables section
2. Add each variable above

## 🚨 Most Common Issues:

### 1. CORS Error
**Symptom:** "Access to fetch blocked by CORS policy"
**Fix:** Set `FRONTEND_URL` to your deployed client URL

### 2. API Connection Error
**Symptom:** "Failed to fetch" or "Network Error"
**Fix:** Set `REACT_APP_SERVER_URL` to your deployed server URL

### 3. Database Connection Error
**Symptom:** "MongoNetworkError" or "Connection timeout"
**Fix:** 
- Set correct `MONGODB_URI`
- Whitelist your deployment IP in MongoDB Atlas
- Ensure cluster is running

### 4. Session Issues (RENDER-SPECIFIC FIXES APPLIED)
**Symptom:** "Unauthorized" or login doesn't persist, multiple sessions created
**Fix:** 
- Set `SESSION_SECRET` (minimum 32 characters)
- Ensure HTTPS in production
- ✅ Cookie sameSite set to 'lax' for Render compatibility
- ✅ Cookie domain removed to use request domain
- ✅ Session store optimized with touchAfter and autoRemove
- ✅ CORS origin validation improved for production

### 5. Render-Specific Session Configuration
**Applied Fixes:**
- Session cookies now use `sameSite: 'lax'` instead of 'none'
- Cookie domain set to `undefined` to auto-detect from request
- MongoDB session store optimized with lazy updates
- CORS configuration updated for Render deployment
- Session creation now properly awaited in login flow

## 📝 Quick Test:

After setting environment variables:
1. Redeploy both client and server
2. Check browser Network tab for API calls
3. Check server logs for MongoDB connection
4. Verify CORS headers in response

## 🔍 Debugging Steps:

1. **Check Browser Console:**
   - Look for CORS errors
   - Check API request URLs
   - Verify response status codes

2. **Check Server Logs:**
   - MongoDB connection status
   - API request logs
   - CORS configuration logs

3. **Test API Directly:**
   - Try accessing `https://your-server-url/api/session`
   - Should return session info or proper error

## 🎯 Priority Order:
1. Set `MONGODB_URI` (database connection)
2. Set `FRONTEND_URL` (CORS)
3. Set `REACT_APP_SERVER_URL` (API connection)
4. Set `SESSION_SECRET` (authentication)
5. Set other variables as needed
