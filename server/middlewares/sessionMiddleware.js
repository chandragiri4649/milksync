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

// Check if user is authenticated (supports both sessions and JWT tokens)
const isAuthenticated = (req, res, next) => {
  console.log('🔐 isAuthenticated - Auth check:', {
    hasSession: !!req.session,
    userId: req.session?.userId,
    userRole: req.session?.userRole,
    sessionId: req.session?.id,
    cookies: req.headers.cookie ? 'Present' : 'Missing',
    authHeader: req.headers.authorization ? 'Present' : 'Missing',
    userAgent: req.headers['user-agent']?.substring(0, 50)
  });
  
  // First, try session-based authentication (for same-domain or when cookies work)
  if (req.session && req.session.userId && req.session.userRole) {
    console.log('✅ isAuthenticated - Session valid for:', req.session.userRole);
    return next();
  }
  
  // Fallback to JWT token authentication (for cross-domain when cookies are blocked)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      
      console.log('✅ isAuthenticated - JWT token valid for:', decoded.role);
      
      // Set user info in request for downstream middleware
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };
      
      return next();
    } catch (jwtError) {
      console.log('❌ isAuthenticated - JWT token invalid:', jwtError.message);
    }
  }
  
  // Neither session nor JWT token worked
  console.log('❌ isAuthenticated - No valid authentication found');
  console.log('🔍 Debug - Full session object:', req.session);
  console.log('🔍 Debug - Request headers:', {
    cookie: req.headers.cookie,
    authorization: req.headers.authorization ? 'Bearer token present' : 'No auth header',
    origin: req.headers.origin,
    referer: req.headers.referer
  });
  
  res.status(401).json({ 
    message: 'Authentication required',
    sessionExpired: true,
    debug: {
      hasSession: !!req.session,
      sessionId: req.sessionID,
      cookiePresent: !!req.headers.cookie,
      authHeaderPresent: !!req.headers.authorization
    }
  });
};

// Check if user has specific role (supports both sessions and JWT tokens)
const hasRole = (roles) => {
  return (req, res, next) => {
    let userRole = null;
    
    // Get user role from session or JWT token
    if (req.session && req.session.userRole) {
      userRole = req.session.userRole;
    } else if (req.user && req.user.role) {
      userRole = req.user.role;
    }
    
    if (!userRole) {
      return res.status(401).json({ 
        message: 'Authentication required',
        sessionExpired: true 
      });
    }

    if (Array.isArray(roles)) {
      if (roles.includes(userRole)) {
        next();
      } else {
        res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
    } else {
      if (userRole === roles) {
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
    
    // Clear cookie with same options as set (updated for Render cross-domain)
    res.clearCookie('milksync-session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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
