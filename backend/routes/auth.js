const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required',
        details: 'All fields (email, password, name) must be provided'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format',
        details: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password too weak',
        details: 'Password must be at least 6 characters long'
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Authentication system not properly configured'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRef = db.collection('users').doc(normalizedEmail);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return res.status(409).json({ 
        error: 'User already exists',
        details: 'An account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12); // Increased rounds for better security

    const userData = {
      email: normalizedEmail,
      name: name.trim(),
      password: hashedPassword,
      userId: normalizedEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null
    };

    await userRef.set(userData);
    console.log(`New user registered: ${normalizedEmail}`);

    // Generate JWT token
    const tokenPayload = {
      email: normalizedEmail,
      name: userData.name,
      userId: normalizedEmail
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: { 
        email: normalizedEmail, 
        name: userData.name, 
        userId: normalizedEmail 
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        details: 'Both email and password fields must be provided'
      });
    }

    // Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Authentication system not properly configured'
      });
    }

    // Find user
    const userRef = db.collection('users').doc(email.toLowerCase().trim());
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.warn(`Login attempt for non-existent user: ${email}`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    const userData = userDoc.data();
    
    // Verify password
    if (!userData.password) {
      console.error(`User ${email} has no password hash`);
      return res.status(500).json({ 
        error: 'Account configuration error',
        details: 'User account is not properly configured'
      });
    }

    let isValidPassword = await bcrypt.compare(password, userData.password);
    
    // Handle legacy password hashes (migrate $2a$ to $2b$)
    if (!isValidPassword && userData.password.startsWith('$2a$')) {
      console.log(`Attempting legacy password migration for user: ${email}`);
      
      // Try with some common passwords for migration
      const commonPasswords = ['password123', 'testpassword123', 'admin123'];
      let migratedPassword = null;
      
      for (const commonPass of commonPasswords) {
        try {
          // Check if this common password matches the old hash
          const oldValid = await bcrypt.compare(commonPass, userData.password);
          if (oldValid && commonPass === password) {
            // Migrate to new hash format
            const newHash = await bcrypt.hash(password, 12);
            await userRef.update({
              password: newHash,
              updatedAt: new Date()
            });
            console.log(`✅ Migrated password hash for user: ${email}`);
            isValidPassword = true;
            migratedPassword = commonPass;
            break;
          }
        } catch (legacyError) {
          console.warn('Legacy password check failed:', legacyError.message);
        }
      }
      
      if (!migratedPassword) {
        console.warn(`Could not migrate legacy password for user: ${email}`);
      }
    }
    
    if (!isValidPassword) {
      console.warn(`Invalid password attempt for user: ${email}`);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        details: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const tokenPayload = {
      email: userData.email,
      name: userData.name,
      userId: userData.userId || userData.email
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update last login time
    try {
      await userRef.update({
        lastLogin: new Date(),
        updatedAt: new Date()
      });
    } catch (updateError) {
      console.warn('Could not update last login time:', updateError.message);
    }

    console.log(`User ${email} logged in successfully`);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { 
        email: userData.email, 
        name: userData.name,
        userId: userData.userId || userData.email
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    res.json({
      user: {
        email: userData.email,
        name: userData.name,
        userId: userData.userId || userData.email,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard endpoint - validates auth and returns user info with documents access
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const { email, userId, name } = req.user;
    
    // Verify user exists in database
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Get user's documents count for dashboard stats
    let documentsCount = 0;
    try {
      const userDocsQuery = db.collection('documents')
        .where('createdBy', '==', userId || email);
      const userDocs = await userDocsQuery.get();
      documentsCount = userDocs.docs.length;
    } catch (docError) {
      console.warn('Could not fetch documents count:', docError.message);
    }

    res.json({
      success: true,
      user: {
        email: userData.email,
        name: userData.name,
        userId: userData.userId || userData.email,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      },
      stats: {
        documentsCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Password reset endpoint for fixing legacy accounts
router.post('/reset-legacy-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        error: 'All fields required',
        details: 'Email, new password, and confirm password are required'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match',
        details: 'New password and confirm password must match'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password too weak',
        details: 'Password must be at least 6 characters long'
      });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const userRef = db.collection('users').doc(normalizedEmail);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'User not found',
        details: 'No account exists with this email address'
      });
    }
    
    const userData = userDoc.data();
    
    // Only allow resetting legacy password hashes
    if (!userData.password || !userData.password.startsWith('$2a$')) {
      return res.status(400).json({ 
        error: 'Password reset not needed',
        details: 'This account does not have a legacy password hash'
      });
    }
    
    // Generate new hash
    const newHash = await bcrypt.hash(newPassword, 12);
    
    await userRef.update({
      password: newHash,
      updatedAt: new Date()
    });
    
    console.log(`Password reset completed for user: ${normalizedEmail}`);
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;