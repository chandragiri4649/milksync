const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');

// Session configuration with environment-aware settings
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev-only',
  name: 'milksync-session', // Custom session name for better identification
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something is stored
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/milksync',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 24 hours in seconds
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-origin
    path: '/', // Available on all paths
    // Add domain setting for cross-origin cookies
    // Try without domain first for Render deployment
    domain: process.env.COOKIE_DOMAIN || undefined
  }
};

// Session middleware
const sessionMiddleware = session(sessionConfig);

// Cookie parser middleware
const cookieMiddleware = cookieParser();

module.exports = {
  sessionMiddleware,
  cookieMiddleware,
  sessionConfig
};
