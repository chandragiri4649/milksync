# Session Management Improvements

## 🎯 Overview

The session management system has been improved to use role-based determination instead of checking each user type sequentially. This approach is more efficient and cleaner.

## 🔄 Before vs After

### Before (Sequential Checking):
```javascript
// Check admin session first
let sessionData = await apiService.checkSession('admin');
if (sessionData && sessionData.user) {
  setIsAuthenticated(true);
  setUserType('admin');
  setUser(sessionData.user);
  return;
}

// If no admin session, try staff
sessionData = await apiService.checkSession('staff');
if (sessionData && sessionData.user) {
  setIsAuthenticated(true);
  setUserType('staff');
  setUser(sessionData.user);
  return;
}
```

### After (Role-Based Determination):
```javascript
// Single session check that returns user with role
const sessionData = await apiService.checkSession();
if (sessionData && sessionData.user) {
  setIsAuthenticated(true);
  setUserType(sessionData.user.role || sessionData.userType);
  setUser(sessionData.user);
  return;
}
```

## 🏗️ Architecture Changes

### 1. **New Generic Session Endpoint** (`/api/session`)
- Single endpoint that handles all user types
- Returns user data with role information
- More efficient than multiple endpoint calls

### 2. **Updated API Service**
- `checkSession()` - No longer requires userType parameter
- `logout()` - Generic logout endpoint
- Simplified error handling

### 3. **Enhanced Server-Side Logic**
- Role determination happens on the server
- Single session validation logic
- Consistent user data structure

## 🔧 Implementation Details

### Server-Side (`server/routes/sessionRoutes.js`)
```javascript
// Generic session check endpoint
router.get('/session', isAuthenticated, async (req, res) => {
  const { userId, userRole } = req.session;
  
  let user;
  
  // Get user data based on role
  switch (userRole) {
    case 'admin':
      user = await Admin.findById(userId).select('-password');
      break;
    case 'staff':
      user = await Staff.findById(userId).select('-password');
      break;
    case 'distributor':
      user = await Distributor.findById(userId).select('-password');
      break;
  }

  // Add role to user object
  const userWithRole = {
    ...user.toObject(),
    role: userRole
  };

  res.json({
    user: userWithRole,
    userType: userRole,
    sessionValid: true
  });
});
```

### Client-Side (`client/src/hooks/useAuth.js`)
```javascript
// Single session check
const sessionData = await apiService.checkSession();
if (sessionData && sessionData.user) {
  setIsAuthenticated(true);
  setUserType(sessionData.user.role || sessionData.userType);
  setUser(sessionData.user);
}
```

## ✅ Benefits

### 1. **Performance**
- Single API call instead of multiple sequential calls
- Reduced network overhead
- Faster session validation

### 2. **Simplicity**
- Cleaner code structure
- Less complex logic
- Easier to maintain

### 3. **Consistency**
- Single source of truth for session data
- Consistent user object structure
- Unified error handling

### 4. **Scalability**
- Easy to add new user types
- Centralized session management
- Better resource utilization

## 🚀 Usage Examples

### Session Check:
```javascript
// Old way
const adminSession = await apiService.checkSession('admin');
const staffSession = await apiService.checkSession('staff');
// ... multiple calls

// New way
const session = await apiService.checkSession();
// Single call returns user with role
```

### Logout:
```javascript
// Old way
await apiService.logout('admin'); // or 'staff'

// New way
await apiService.logout(); // Generic logout
```

### User Type Determination:
```javascript
// Old way
if (adminSession) userType = 'admin';
else if (staffSession) userType = 'staff';

// New way
userType = sessionData.user.role;
```

## 🔒 Security Considerations

### 1. **Role Validation**
- Server validates user role from session
- Client receives role information from server
- No client-side role guessing

### 2. **Session Integrity**
- Single session validation point
- Consistent session destruction
- Proper cookie clearing

### 3. **Error Handling**
- Centralized error responses
- Consistent session expiry handling
- Proper cleanup on errors

## 📋 Migration Checklist

### ✅ Completed:
- [x] Created generic session endpoint
- [x] Updated API service methods
- [x] Modified useAuth hook
- [x] Added session routes to server
- [x] Updated documentation
- [x] Maintained backward compatibility

### 🔧 Testing:
- [ ] Test session check with different user types
- [ ] Verify role determination works correctly
- [ ] Test logout functionality
- [ ] Check error handling
- [ ] Validate session expiry

## 🧪 Testing Commands

### Test Session Check:
```javascript
// In browser console
const testSession = async () => {
  try {
    const response = await fetch('/api/session', {
      credentials: 'include'
    });
    const data = await response.json();
    console.log('Session data:', data);
    console.log('User role:', data.user?.role);
  } catch (error) {
    console.error('Session check failed:', error);
  }
};
```

### Test Logout:
```javascript
// In browser console
const testLogout = async () => {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });
    console.log('Logout response:', await response.json());
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

## 🚨 Troubleshooting

### Issue 1: Role Not Determined
**Problem**: User role is undefined
**Solution**: Check server session data structure and ensure role is included

### Issue 2: Session Not Found
**Problem**: Session check returns 401
**Solution**: Verify session middleware and cookie settings

### Issue 3: Multiple User Types
**Problem**: User has multiple roles
**Solution**: Ensure only one active session per user

## 📞 Support

For issues or questions about the session management improvements:
1. Check the session logs in server console
2. Verify cookie settings in browser
3. Test with different user types
4. Review the session middleware configuration
