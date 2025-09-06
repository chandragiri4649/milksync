# Cross-Origin Session Management Setup

This guide explains how to configure session management when your server and client are deployed to different domains/origins.

## 🌐 Understanding Cross-Origin Cookies

### SameSite Cookie Values:

1. **`strict`** - Cookies only sent in same-site requests (default)
2. **`lax`** - Cookies sent in same-site and top-level navigation
3. **`none`** - Cookies sent in all requests (requires `secure: true`)

## 🔧 Environment Configuration

### Production Environment Variables:

```env
# Session configuration
SESSION_SECRET=your-super-secret-key-here

# Frontend URL (your client domain)
FRONTEND_URL=https://your-frontend-domain.com

# Cookie domain (optional - for subdomain sharing)
COOKIE_DOMAIN=.yourdomain.com

# Node environment
NODE_ENV=production
```

### Development Environment Variables:

```env
# Session configuration
SESSION_SECRET=dev-secret-key

# Frontend URL (your local client)
FRONTEND_URL=http://localhost:3000

# Node environment
NODE_ENV=development
```

## 🚀 Deployment Scenarios

### Scenario 1: Different Domains
```
Server: https://api.milksync.com
Client: https://milksync.com
```

**Configuration:**
```env
FRONTEND_URL=https://milksync.com
NODE_ENV=production
# COOKIE_DOMAIN not needed
```

### Scenario 2: Subdomains
```
Server: https://api.milksync.com
Client: https://app.milksync.com
```

**Configuration:**
```env
FRONTEND_URL=https://app.milksync.com
COOKIE_DOMAIN=.milksync.com
NODE_ENV=production
```

### Scenario 3: Different Ports (Development)
```
Server: http://localhost:5000
Client: http://localhost:3000
```

**Configuration:**
```env
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
# COOKIE_DOMAIN not needed
```

## 🔒 Security Considerations

### Production Requirements:

1. **HTTPS Required**: `sameSite: 'none'` requires `secure: true`
2. **Strong Session Secret**: Use a cryptographically secure secret
3. **Proper CORS**: Only allow your frontend domain
4. **Cookie Domain**: Set appropriately for your setup

### Security Checklist:

- [ ] Server running on HTTPS
- [ ] Frontend running on HTTPS
- [ ] Strong session secret configured
- [ ] CORS origin set to your frontend domain
- [ ] Cookie domain configured (if using subdomains)

## 🧪 Testing Cross-Origin Setup

### 1. Test Cookie Setting:
```javascript
// Frontend (your client domain)
const response = await fetch('https://api.milksync.com/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

console.log('Cookies set:', document.cookie);
```

### 2. Test Session Validation:
```javascript
// Frontend
const sessionResponse = await fetch('https://api.milksync.com/api/admin/session', {
  credentials: 'include'
});

if (sessionResponse.ok) {
  const data = await sessionResponse.json();
  console.log('Session valid:', data);
} else {
  console.log('Session invalid');
}
```

### 3. Browser Developer Tools:
1. Open Developer Tools (F12)
2. Go to Application/Storage tab
3. Check Cookies section
4. Verify `milksync-session` cookie is set
5. Check SameSite attribute

## 🚨 Common Issues & Solutions

### Issue 1: Cookie Not Set
**Error**: Cookie not appearing in browser
**Solution**: 
- Ensure `secure: true` when using `sameSite: 'none'`
- Check CORS configuration
- Verify frontend domain in CORS origin

### Issue 2: CORS Errors
**Error**: CORS policy blocked request
**Solution**:
- Add frontend domain to CORS origin
- Ensure `credentials: true` in CORS config
- Check preflight requests

### Issue 3: Session Not Persisting
**Error**: Session lost on page refresh
**Solution**:
- Check cookie domain setting
- Verify SameSite configuration
- Ensure HTTPS in production

### Issue 4: Mixed Content Errors
**Error**: Mixed content warnings
**Solution**:
- Use HTTPS for both server and client
- Update all URLs to use HTTPS

## 📋 Deployment Checklist

### Before Deployment:
- [ ] Set `NODE_ENV=production`
- [ ] Configure `SESSION_SECRET`
- [ ] Set `FRONTEND_URL` to your client domain
- [ ] Configure `COOKIE_DOMAIN` (if needed)
- [ ] Ensure HTTPS certificates
- [ ] Test cross-origin requests

### After Deployment:
- [ ] Test login functionality
- [ ] Verify session persistence
- [ ] Check cookie attributes
- [ ] Test logout functionality
- [ ] Monitor for CORS errors

## 🔧 Advanced Configuration

### Multiple Frontend Domains:
```javascript
// In app.js
const allowedOrigins = [
  'https://milksync.com',
  'https://app.milksync.com',
  'https://admin.milksync.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Custom Cookie Settings:
```javascript
// In config/session.js
const sessionConfig = {
  // ... other settings
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN,
    path: '/',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
};
```

## 📞 Troubleshooting Commands

### Check Server Configuration:
```bash
# Check environment variables
echo $NODE_ENV
echo $FRONTEND_URL
echo $SESSION_SECRET

# Test server response
curl -I https://api.milksync.com/api/test
```

### Check Cookie Headers:
```bash
# Test login and check cookies
curl -X POST https://api.milksync.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -v
```

### Browser Console Commands:
```javascript
// Check if cookies are set
console.log(document.cookie);

// Check cookie attributes
console.log(document.cookie.split(';').map(c => c.trim()));

// Test session endpoint
fetch('https://api.milksync.com/api/admin/session', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```
