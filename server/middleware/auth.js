const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Middleware to require specific user types
const requireUserType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({ 
        error: `Access denied. Required user types: ${allowedTypes.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware for admin access
const requireAdmin = requireUserType(['admin']);

// Middleware for business/landlord access
const requireBusinessOrLandlord = requireUserType(['business', 'landlord', 'admin']);

// Middleware for landlord access
const requireLandlord = requireUserType(['landlord', 'admin']);

// Middleware for business access
const requireBusiness = requireUserType(['business', 'admin']);

module.exports = {
  requireAuth,
  requireUserType,
  requireAdmin,
  requireBusinessOrLandlord,
  requireLandlord,
  requireBusiness
}; 