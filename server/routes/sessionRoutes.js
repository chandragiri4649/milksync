const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/sessionMiddleware');
const Admin = require('../models/Admin');
const Staff = require('../models/Staff');
const Distributor = require('../models/Distributor');

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
      
      // Clear cookie with same options as set
      res.clearCookie('milksync-session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined,
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
