const jwt = require('jsonwebtoken');
const { auth } = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        details: 'Authorization header with Bearer token is required'
      });
    }

    // Check if JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Authentication system not properly configured'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate decoded token structure
    if (!decoded.email || !decoded.userId) {
      return res.status(403).json({ 
        error: 'Invalid token structure',
        details: 'Token does not contain required user information'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.warn('Token verification failed:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: 'Invalid token',
        details: 'The provided token is malformed or invalid'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'Token expired',
        details: 'The provided token has expired, please login again'
      });
    } else {
      return res.status(403).json({ 
        error: 'Token verification failed',
        details: error.message
      });
    }
  }
};

const authenticateFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const idToken = authHeader && authHeader.split(' ')[1];

  if (!idToken) {
    return res.status(401).json({ error: 'Firebase ID token required' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid Firebase token' });
  }
};

module.exports = {
  authenticateToken,
  authenticateFirebaseToken
};