const jwt = require('jsonwebtoken');
const { auth } = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
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