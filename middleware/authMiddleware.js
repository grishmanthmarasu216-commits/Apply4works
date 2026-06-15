const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      if (error.name === 'MongoServerSelectionError' || error.message.includes('Mongo')) {
        console.error('Auth Middleware MongoDB Error:', error.message);
        // Do not crash the entire request, just proceed as unauthenticated
      } else {
        console.error('Auth Middleware Error:', error);
      }
      res.status(401).json({ success: false, message: 'Not authorized' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

const protectPremium = async (req, res, next) => {
  if (req.user && req.user.plan !== 'Free' && req.user.plan !== 'Basic') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized for premium features. Please upgrade your plan.' });
  }
};

const hasProAccess = async (req, res, next) => {
  if (req.user && (req.user.planType === 'PRO' || req.user.plan === 'Pro' || req.user.plan === 'Pro Plus')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Available in Pro Plan. Please upgrade.' });
  }
};

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      console.error('Optional Auth Error:', error.message);
    }
  }
  next();
};

module.exports = { protect, protectPremium, hasProAccess, optionalAuth };
