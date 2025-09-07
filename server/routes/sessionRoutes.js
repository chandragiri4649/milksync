const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/sessionMiddleware');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Distributor = require('../models/Distributor');

// Debug endpoint for deployment troubleshooting
router.get('/debug', (req, res) => {
  res.json({
    status: "Debug Info",
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'not set',
      FRONTEND_URL: process.env.FRONTEND_URL || 'not set',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'configured' : 'not set'
    },
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    },
    session: {
      userId: req.session?.userId || 'no session',
      userRole: req.session?.userRole || 'no role',
      sessionId: req.sessionID || 'no session ID'
    },
    headers: {
      origin: req.get('Origin') || 'no origin',
      userAgent: req.get('User-Agent') || 'no user agent',
      cookie: req.get('Cookie') ? 'present' : 'missing'
    },
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to manually create and verify session
router.post('/test-session', async (req, res) => {
  try {
    // Create a test session
    req.session.userId = 'test-user-id';
    req.session.userRole = 'test-role';
    req.session.testData = 'This is test data';
    
    req.session.save((err) => {
      if (err) {
        console.error('Test session save error:', err);
        return res.status(500).json({ error: 'Failed to save test session' });
      }
      
      console.log('✅ Test session created:', {
        sessionId: req.sessionID,
        sessionData: req.session
      });
      
      res.json({
        message: 'Test session created',
        sessionId: req.sessionID,
        sessionData: req.session,
        cookies: req.cookies || {}
      });
    });
  } catch (error) {
    console.error('Test session error:', error);
    res.status(500).json({ error: 'Failed to create test session' });
  }
});

// Cookie test endpoint - manually set a simple cookie
router.get('/test-cookie', (req, res) => {
  console.log('🍪 Setting test cookie...');
  
  // Set a simple test cookie with same settings as session cookie
  res.cookie('test-cookie', 'test-value-123', {
    httpOnly: false, // Allow JS access for testing
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 60 * 60 * 1000, // 1 hour
    path: '/'
  });
  
  console.log('🍪 Test cookie set with options:', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 60 * 60 * 1000,
    path: '/'
  });
  
  res.json({ 
    message: 'Test cookie set',
    cookieValue: 'test-value-123',
    cookieOptions: {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000,
      path: '/'
    }
  });
});

// Check if test cookie is received
router.get('/check-cookie', (req, res) => {
  console.log('🔍 Checking cookies:', {
    allCookies: req.cookies,
    testCookie: req.cookies['test-cookie'],
    sessionCookie: req.cookies['milksync-session'],
    rawCookieHeader: req.headers.cookie
  });
  
  res.json({
    message: 'Cookie check',
    cookies: req.cookies || {},
    testCookie: req.cookies['test-cookie'] || 'Not found',
    sessionCookie: req.cookies['milksync-session'] || 'Not found',
    rawCookieHeader: req.headers.cookie || 'No cookie header'
  });
});

// Session check without authentication middleware for debugging
router.get('/session-info', async (req, res) => {
  try {
    console.log('🔍 Session Info Debug:', {
      sessionID: req.sessionID,
      session: req.session,
      cookies: req.cookies,
      headers: {
        cookie: req.get('Cookie'),
        origin: req.get('Origin'),
        userAgent: req.get('User-Agent')
      }
    });
    
    res.json({
      sessionID: req.sessionID || 'No session ID',
      hasSession: !!req.session,
      sessionData: req.session || {},
      cookies: req.cookies || {},
      headers: {
        cookie: req.get('Cookie') || 'No cookie header',
        origin: req.get('Origin'),
        userAgent: req.get('User-Agent')
      }
    });
  } catch (error) {
    console.error('Session info error:', error);
    res.status(500).json({ error: 'Failed to get session info' });
  }
});

// Generic session check endpoint
router.get('/session', isAuthenticated, async (req, res) => {
  try {
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
      default:
        return res.status(400).json({ message: 'Invalid user role' });
    }

    if (!user) {
      // Clear invalid session
      req.session.destroy();
      return res.status(401).json({ 
        message: 'User not found. Session cleared.',
        sessionExpired: true 
      });
    }

    // Add role to user object for frontend
    const userWithRole = {
      ...user.toObject(),
      role: userRole
    };

    res.json({
      user: userWithRole,
      userType: userRole,
      sessionValid: true
    });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ message: 'Session validation failed' });
  }
});

// Generic logout endpoint
router.post('/logout', (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      
      // Clear cookie with same options as set (updated for Render cross-domain)
      res.clearCookie('milksync-session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: undefined, // Let it default to request domain
        path: '/'
      });
      
      console.log('✅ Session destroyed successfully');
      res.json({ message: 'Logout successful' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

module.exports = router;
