# Session Management Implementation

This document explains the session management system implemented in MilkSync using cookies and Express sessions.

## 🔧 Overview

The session management system provides:
- **Secure authentication** using HTTP-only cookies
- **Session persistence** across browser tabs/windows
- **Automatic session expiry** (24 hours)
- **CSRF protection** with SameSite cookies
- **Role-based access control**

## 🏗️ Architecture

### Components:
1. **Session Configuration** (`config/session.js`)
2. **Session Middleware** (`middlewares/sessionMiddleware.js`)
3. **Updated Controllers** (Admin, Staff, Distributor)
4. **Updated Routes** with session protection

## 🔐 Session Configuration

### Environment Variables:
```env
# Session secret (change in production!)
SESSION_SECRET=your-super-secret-key-here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Node environment
NODE_ENV=development
```

### Session Settings:
- **Secret**: Used to sign session cookies
- **Cookie Settings**:
  - `secure`: HTTPS only in production
  - `httpOnly`: Prevents XSS attacks
  - `maxAge`: 24 hours
  - `sameSite`: 'strict' for CSRF protection
- **Session Name**: `milksync-session`

## 🚀 Usage Examples

### 1. Admin Login
```javascript
// Frontend
const response = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const data = await response.json();
// Session cookie is automatically set
```

### 2. Check Session Status
```javascript
// Frontend
const response = await fetch('/api/admin/session', {
  credentials: 'include'
});

const sessionData = await response.json();
// Returns user info and session details
```

### 3. Logout
```javascript
// Frontend
const response = await fetch('/api/admin/logout', {
  method: 'POST',
  credentials: 'include'
});

// Session is destroyed and cookie cleared
```

## 🛡️ Security Features

### 1. HTTP-Only Cookies
- Cookies cannot be accessed via JavaScript
- Prevents XSS attacks

### 2. SameSite Protection
- `sameSite: 'strict'` prevents CSRF attacks
- Cookies only sent in same-site requests

### 3. Secure Cookies
- In production, cookies only sent over HTTPS
- Prevents man-in-the-middle attacks

### 4. Session Expiry
- Automatic expiry after 24 hours
- Forces re-authentication

## 🔄 Migration from JWT

### Before (JWT):
```javascript
// Store token in localStorage
localStorage.setItem('token', response.token);

// Send with every request
headers: {
  'Authorization': `Bearer ${token}`
}
```

### After (Sessions):
```javascript
// No manual token handling needed
// Cookies are automatically sent with requests
credentials: 'include'
```

## 📋 API Endpoints

### Admin Routes:
- `POST /api/admin/login` - Login with session
- `POST /api/admin/logout` - Logout and destroy session
- `GET /api/admin/session` - Get current session info

### Staff Routes:
- `POST /api/staff/login` - Login with session
- `POST /api/staff/logout` - Logout and destroy session
- `GET /api/staff/session` - Get current session info

### Distributor Routes:
- `POST /api/distributor/login` - Login with session
- `POST /api/distributor/logout` - Logout and destroy session
- `GET /api/distributor/session` - Get current session info

## 🔧 Middleware Functions

### `isAuthenticated`
- Checks if user has valid session
- Returns 401 if no session

### `hasRole(roles)`
- Checks if user has required role(s)
- Supports single role or array of roles
- Returns 403 if insufficient permissions

### `getCurrentUser`
- Fetches current user from database
- Adds user object to `req.currentUser`
- Clears invalid sessions automatically

## 🚨 Error Handling

### Session Expired:
```json
{
  "message": "Session expired. Please login again.",
  "sessionExpired": true
}
```

### Authentication Required:
```json
{
  "message": "Authentication required",
  "sessionExpired": true
}
```

### Access Denied:
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

## 🔄 Frontend Integration

### 1. Update API Calls:
```javascript
// Add credentials to all fetch calls
const response = await fetch('/api/endpoint', {
  credentials: 'include'
});
```

### 2. Handle Session Expiry:
```javascript
if (response.status === 401) {
  const data = await response.json();
  if (data.sessionExpired) {
    // Redirect to login
    window.location.href = '/login';
  }
}
```

### 3. Session Check on App Load:
```javascript
// Check session status when app loads
const checkSession = async () => {
  try {
    const response = await fetch('/api/admin/session', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      // Set user state
      setUser(data.user);
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Session check failed:', error);
  }
};
```

## 🧪 Testing

### Test Session Creation:
```bash
# Login
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"admin","password":"admin123"}'

# Check session
curl -X GET http://localhost:5000/api/admin/session \
  -b cookies.txt
```

## 🔒 Production Considerations

1. **Change Session Secret**: Use strong, unique secret
2. **Enable HTTPS**: Required for secure cookies
3. **Set Proper CORS**: Configure frontend URL
4. **Session Store**: Consider Redis for production
5. **Monitoring**: Log session events

## 📝 Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure `credentials: true` in CORS config
2. **Cookie Not Set**: Check `httpOnly` and `secure` settings
3. **Session Lost**: Verify cookie domain and path
4. **CSRF Errors**: Check `sameSite` setting

### Debug Commands:
```javascript
// Check session in route
console.log('Session:', req.session);

// Check cookies
console.log('Cookies:', req.cookies);
```
