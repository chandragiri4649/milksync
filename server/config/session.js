const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');

// Session configuration for debugging
const sessionConfig = {
  secret: 'test-secret-key',
  name: 'connect.sid', // Explicitly set session name
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
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
