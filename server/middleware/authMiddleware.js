const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'friday_secret_fallback');
      
      // Decoded token contains: id, email (as generated in routes/auth.js)
      req.userId = decoded.id;
      req.userEmail = decoded.email ? decoded.email.toLowerCase() : null;
      req.isAuthenticated = true;
      return next();
    }
  } catch (error) {
    console.error('JWT Auth Middleware Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: Invalid, expired, or malformed token.'
    });
  }

  req.isAuthenticated = false;
  next();
};

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated || !req.userId) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Authentication is required to access this resource.'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  requireAuth
};
