const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Distributor = require('../models/Distributor');

// Session validation middleware
const validateSession = (req, res, next) => {
  if (!req.session || !req.session.userId || !req.session.userRole) {
    return res.status(401).json({ 
      message: 'Session expired. Please login again.',
      sessionExpired: true 
    });
  }
  next();
};

// Get current user from session
const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId || !req.session.userRole) {
      return res.status(401).json({ 
        message: 'No active session found.',
        sessionExpired: true 
      });
    }

    let user;
    const { userId, userRole } = req.session;

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

    req.currentUser = user;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({ message: 'Session validation failed' });
  }
};

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  console.log('🔐 isAuthenticated - Session check:', {
    hasSession: !!req.session,
    userId: req.session?.userId,
    userRole: req.session?.userRole,
    sessionId: req.session?.id,
    cookies: req.headers.cookie ? 'Present' : 'Missing',
    customSessionId: req.headers['x-session-id'] || 'Not provided',
    userAgent: req.headers['user-agent']?.substring(0, 50)
  });
  
  // Check if session exists and is valid
  if (req.session && req.session.userId && req.session.userRole) {
    console.log('✅ isAuthenticated - Session valid for:', req.session.userRole);
    next();
  } else {
    console.log('❌ isAuthenticated - Session invalid or missing');
    console.log('🔍 Debug - Full session object:', req.session);
    console.log('🔍 Debug - Request headers:', {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer,
      sessionId: req.headers['x-session-id']
    });
    
    // For debugging: Show more detailed session info
    if (req.session) {
      console.log('🔍 Session exists but missing data:', {
        sessionId: req.sessionID,
        hasUserId: !!req.session.userId,
        hasUserRole: !!req.session.userRole,
        sessionKeys: Object.keys(req.session)
      });
    }
    
    res.status(401).json({ 
      message: 'Authentication required',
      sessionExpired: true,
      debug: {
        hasSession: !!req.session,
        sessionId: req.sessionID,
        cookiePresent: !!req.headers.cookie
      }
    });
  }
};

// Check if user has specific role
const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.userRole) {
      return res.status(401).json({ 
        message: 'Authentication required',
        sessionExpired: true 
      });
    }

    if (Array.isArray(roles)) {
      if (roles.includes(req.session.userRole)) {
        next();
      } else {
        res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
    } else {
      if (req.session.userRole === roles) {
        next();
      } else {
        res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
    }
  };
};

// Create session for user
const createUserSession = (req, user, role) => {
  return new Promise((resolve, reject) => {
    req.session.userId = user._id;
    req.session.userRole = role;
    req.session.username = user.username || user.email;
    
    // Set session expiry
    req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    console.log(`✅ Session created for ${role}: ${user.username || user.email}`, {
      sessionId: req.session.id,
      userId: req.session.userId,
      userRole: req.session.userRole
    });
    
    // Save session explicitly to ensure it's stored
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        reject(err);
      } else {
        console.log('✅ Session saved successfully');
        resolve();
      }
    });
  });
};

// Destroy session
const destroySession = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    
    // Clear cookie with same options as set (updated for Render)
    res.clearCookie('milksync-session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
      domain: undefined, // Let it default to request domain
      path: '/'
    });
    console.log('✅ Session destroyed successfully');
    next();
  });
};

module.exports = {
  validateSession,
  getCurrentUser,
  isAuthenticated,
  hasRole,
  createUserSession,
  destroySession
};
