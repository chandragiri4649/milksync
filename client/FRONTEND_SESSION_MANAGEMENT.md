# Frontend Session Management Implementation

This document explains how the frontend has been updated to work with session-based authentication instead of JWT tokens.

## 🔄 Migration Overview

### Before (JWT Tokens):
- Tokens stored in localStorage
- Manual token handling in every API call
- Client-side token validation
- Manual token expiry handling

### After (Session Management):
- Cookies handled automatically by browser
- Centralized API service with session support
- Server-side session validation
- Automatic session expiry handling

## 🏗️ Architecture Changes

### 1. **New API Service** (`src/utils/apiService.js`)
- Centralized API requests with session support
- Automatic `credentials: 'include'` for all requests
- Session expiry detection and handling
- Error handling for cross-origin requests

### 2. **Updated Auth Hook** (`src/hooks/useAuth.js`)
- Session-based authentication state
- Automatic session checking on app load
- Backward compatibility with legacy tokens
- Loading states for better UX

### 3. **Enhanced Protected Routes**
- Session-aware route protection
- Loading states during authentication checks
- Proper role-based access control

## 🔧 Key Components Updated

### API Service (`src/utils/apiService.js`)
```javascript
// All requests automatically include credentials
const defaultOptions = {
  credentials: 'include', // Important for cookies
  headers: {
    'Content-Type': 'application/json',
    ...options.headers,
  },
};

// Session expiry handling
if (response.status === 401 && errorData.sessionExpired) {
  // Clear tokens and redirect to login
  localStorage.removeItem('adminToken');
  localStorage.removeItem('staffToken');
  window.location.href = '/admin/login';
}
```

### Auth Hook (`src/hooks/useAuth.js`)
```javascript
// Session checking on app load
const checkSession = async () => {
  // Check for active session (server returns user info with role)
  const sessionData = await apiService.checkSession();
  if (sessionData && sessionData.user) {
    setIsAuthenticated(true);
    setUserType(sessionData.user.role || sessionData.userType);
    setUser(sessionData.user);
    return;
  }
};
```

### Smart Landing Page (`src/components/SmartLandingPage.jsx`)
```javascript
// Session-aware routing
useEffect(() => {
  if (isLoading) return;
  
  if (isAuthenticated && userType) {
    switch (userType) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'staff':
        navigate('/staff/dashboard');
        break;
      case 'distributor':
        navigate('/distributor/dashboard');
        break;
    }
  }
}, [isAuthenticated, userType, isLoading]);
```

## 🚀 Usage Examples

### 1. **Login Process**
```javascript
// Old way (JWT)
const response = await fetch('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const data = await response.json();
localStorage.setItem('adminToken', data.token);

// New way (Session)
const response = await login({ username, password }, 'admin');
// Session cookie is automatically set by server
```

### 2. **API Requests**
```javascript
// Old way (JWT)
const response = await fetch('/api/admin/data', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  }
});

// New way (Session)
const response = await apiService.get('/admin/data');
// Cookies are automatically sent with requests
```

### 3. **Session Checking**
```javascript
// Old way (JWT)
const token = localStorage.getItem('adminToken');
if (token) {
  const decoded = jwtDecode(token);
  if (Date.now() < decoded.exp * 1000) {
    // Token valid
  }
}

// New way (Session)
const { isAuthenticated, userType, user } = useAuth();
if (isAuthenticated && userType === 'admin') {
  // Session valid
}
```

## 🛡️ Security Features

### 1. **Automatic Cookie Handling**
- Cookies sent automatically with every request
- No manual token management required
- HTTP-only cookies prevent XSS attacks

### 2. **Session Expiry Handling**
- Automatic detection of expired sessions
- Immediate logout and redirect to login
- Clear local state on session expiry

### 3. **Cross-Origin Support**
- Proper CORS configuration for different domains
- SameSite cookie settings for security
- Credentials included in all requests

## 🔄 Migration Checklist

### ✅ Completed:
- [x] Created API service with session support
- [x] Updated useAuth hook for session management
- [x] Updated login components (AdminLogin, StaffLogin)
- [x] Updated protected routes
- [x] Updated SmartLandingPage for session routing
- [x] Added session expiry handling
- [x] Added loading states

### 🔧 Environment Configuration:
```env
# Frontend environment variables
REACT_APP_SERVER_URL=https://your-api-domain.com
```

## 🧪 Testing Session Management

### 1. **Test Login Flow**
```javascript
// In browser console
const testLogin = async () => {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    console.log('Login response:', data);
    
    // Check if cookie was set
    console.log('Cookies:', document.cookie);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 2. **Test Session Validation**
```javascript
// In browser console
const testSession = async () => {
  try {
    const response = await fetch('/api/session', {
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Session data:', data);
  } catch (error) {
    console.error('Session check failed:', error);
  }
};
```

### 3. **Test Logout**
```javascript
// In browser console
const testLogout = async () => {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    console.log('Logout successful');
    console.log('Cookies after logout:', document.cookie);
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

## 🚨 Common Issues & Solutions

### Issue 1: CORS Errors
**Error**: CORS policy blocked request
**Solution**: Ensure server CORS is configured with `credentials: true`

### Issue 2: Cookies Not Set
**Error**: No cookies in browser after login
**Solution**: Check server cookie settings and CORS configuration

### Issue 3: Session Not Persisting
**Error**: Session lost on page refresh
**Solution**: Verify cookie domain and SameSite settings

### Issue 4: Mixed Content Errors
**Error**: Mixed content warnings
**Solution**: Use HTTPS for both frontend and backend

## 📋 Browser Developer Tools

### Check Cookies:
1. Open Developer Tools (F12)
2. Go to Application/Storage → Cookies
3. Look for `milksync-session` cookie
4. Check attributes: HttpOnly, Secure, SameSite

### Check Network Requests:
1. Go to Network tab
2. Make a login request
3. Check if `Set-Cookie` header is present
4. Verify subsequent requests include cookies

### Check Console Logs:
```javascript
// Monitor session state
const { isAuthenticated, userType, user } = useAuth();
console.log('Auth state:', { isAuthenticated, userType, user });
```

## 🔒 Production Considerations

1. **HTTPS Required**: Session cookies require secure connection
2. **Proper CORS**: Configure allowed origins correctly
3. **Cookie Settings**: Set appropriate domain and path
4. **Session Secret**: Use strong session secret on server
5. **Monitoring**: Log session events for debugging

## 📞 Troubleshooting Commands

### Check Session State:
```javascript
// In browser console
const authState = {
  isAuthenticated: false,
  userType: null,
  user: null,
  cookies: document.cookie
};
console.log('Current auth state:', authState);
```

### Test API Endpoints:
```javascript
// Test server connectivity
fetch('/api/test', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Clear All Data:
```javascript
// Clear everything for testing
localStorage.clear();
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
location.reload();
```
