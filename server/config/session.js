const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');

// Session configuration with environment-aware settings
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev-only',
  name: 'connect.sid', // Explicitly set session name
  resave: true,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/milksync',
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 24 hours in seconds
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/' // Explicitly set path
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
