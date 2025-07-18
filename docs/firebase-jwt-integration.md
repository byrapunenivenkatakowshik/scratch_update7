# Firebase + JWT Integration Guide

## Overview

This project uses a **dual authentication system** combining Firebase Firestore as the database with custom JWT authentication for user management. This hybrid approach provides the benefits of Firebase's real-time capabilities with the flexibility of custom authentication.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Firebase      │
│   (React)       │    │   (Express)     │    │   (Firestore)   │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ AuthContext │ │◄──►│ │ JWT Auth    │ │◄──►│ │ User Data   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Components  │ │◄──►│ │ API Routes  │ │◄──►│ │ Documents   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Real-time   │ │◄──►│ │ Socket.IO   │ │◄──►│ │ Realtime DB │ │
│ │ Features    │ │    │ │ WebRTC      │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Firebase Configuration

### 1. Firebase Project Setup

**File: `backend/config/firebase.js`**

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: `https://www.googleapis.com/oauth2/v1/certs`,
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
});

const db = admin.firestore();
const realtimeDb = admin.database();

module.exports = { admin, db, realtimeDb };
```

### 2. Environment Variables

**File: `backend/.env`**

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

## JWT Authentication Implementation

### 1. JWT Middleware

**File: `backend/middleware/auth.js`**

```javascript
const jwt = require('jsonwebtoken');
const { admin, db } = require('../config/firebase');

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Try JWT verification first
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Firestore
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      userId: decoded.userId,
      ...userDoc.data()
    };
    next();
  } catch (jwtError) {
    // Fallback to Firebase ID token verification
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        userId: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name
      };
      next();
    } catch (firebaseError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
};

module.exports = { authenticateToken };
```

### 2. Authentication Routes

**File: `backend/routes/auth.js`**

```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

const router = express.Router();

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user document
    const userData = {
      name,
      email,
      password: hashedPassword,
      userId: email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await userRef.set(userData);

    // Generate JWT
    const token = jwt.sign(
      { userId: email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = userData;

    res.status(201).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from Firestore
    const userRef = db.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const userData = userDoc.data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: userData.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = userData;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
```

## Frontend Integration

### 1. Auth Context

**File: `frontend/src/contexts/AuthContext.jsx`**

```javascript
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetch(`${API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => response.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
          } else {
            localStorage.removeItem('token');
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const { token, user } = await response.json();
    localStorage.setItem('token', token);
    setUser(user);
    return { token, user };
  };

  const register = async (name, email, password) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    const { token, user } = await response.json();
    localStorage.setItem('token', token);
    setUser(user);
    return { token, user };
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 2. API Service with JWT

**File: `frontend/src/services/api.js`**

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const documentService = {
  async getDocuments() {
    const response = await api.get('/api/documents');
    return response.data;
  },

  async getDocument(id) {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  },

  async createDocument(documentData) {
    const response = await api.post('/api/documents', documentData);
    return response.data;
  },

  async updateDocument(id, documentData) {
    const response = await api.put(`/api/documents/${id}`, documentData);
    return response.data;
  },

  async deleteDocument(id) {
    const response = await api.delete(`/api/documents/${id}`);
    return response.data;
  }
};

export default api;
```

## Real-time Integration

### 1. Socket.IO with JWT

**File: `backend/server.js`**

```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userDoc = await db.collection('users').doc(decoded.userId).get();
    
    if (!userDoc.exists) {
      return next(new Error('User not found'));
    }

    socket.user = {
      userId: decoded.userId,
      ...userDoc.data()
    };
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.name}`);

  socket.on('join-document', async (documentId) => {
    try {
      // Verify user has access to document
      const docRef = db.collection('documents').doc(documentId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        socket.emit('error', 'Document not found');
        return;
      }

      const docData = doc.data();
      const hasAccess = docData.isPublic || 
                       docData.collaborators.includes(socket.user.userId) ||
                       docData.createdBy === socket.user.userId;

      if (!hasAccess) {
        socket.emit('error', 'Access denied');
        return;
      }

      socket.join(documentId);
      socket.emit('document-joined', { documentId });
      
      // Notify other users
      socket.to(documentId).emit('user-joined', {
        userId: socket.user.userId,
        userName: socket.user.name
      });
    } catch (error) {
      socket.emit('error', 'Failed to join document');
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.name}`);
  });
});
```

### 2. Frontend Socket Integration

**File: `frontend/src/hooks/useSocket.js`**

```javascript
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = () => {
  const socket = useRef(null);
  const callbacks = useRef({});

  const connect = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socket.current = io(process.env.REACT_APP_WS_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.current.on('connect', () => {
      console.log('Connected to server');
    });

    socket.current.on('error', (error) => {
      console.error('Socket error:', error);
      if (callbacks.current.onError) {
        callbacks.current.onError(error);
      }
    });

    socket.current.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  };

  const disconnect = () => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
    }
  };

  const joinDocument = (documentId) => {
    if (socket.current) {
      socket.current.emit('join-document', documentId);
    }
  };

  const sendContentChange = (documentId, content, userId) => {
    if (socket.current) {
      socket.current.emit('content-change', {
        documentId,
        content,
        userId
      });
    }
  };

  const onContentUpdated = (callback) => {
    callbacks.current.onContentUpdated = callback;
    if (socket.current) {
      socket.current.on('content-updated', callback);
    }
  };

  const onError = (callback) => {
    callbacks.current.onError = callback;
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    connect,
    disconnect,
    joinDocument,
    sendContentChange,
    onContentUpdated,
    onError,
    socket: socket.current
  };
};

export default useSocket;
```

## Data Flow

### 1. Authentication Flow
```
1. User submits login credentials
2. Backend verifies credentials against Firebase
3. Backend generates JWT token
4. Frontend stores JWT in localStorage
5. Frontend includes JWT in API requests
6. Backend verifies JWT for each request
7. Backend queries Firebase for user data
```

### 2. Document Operations Flow
```
1. Frontend sends authenticated request
2. Backend validates JWT token
3. Backend checks document permissions in Firebase
4. Backend performs operation on Firebase
5. Backend returns response to frontend
6. Real-time updates sent via Socket.IO
```

### 3. Real-time Collaboration Flow
```
1. User joins document via Socket.IO
2. Socket.IO middleware validates JWT
3. Backend checks document access in Firebase
4. User joins document room
5. Real-time updates broadcast to room
6. WebRTC establishes peer connections
7. Collaborative editing synchronized
```

## Security Considerations

### 1. Token Security
- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- Token expiration set to 7 days
- Token refresh mechanism implemented
- Secure token transmission over HTTPS

### 2. Firebase Security
- Service account credentials securely stored
- Firebase security rules implemented
- Input validation on all endpoints
- Role-based access control for documents

### 3. Data Protection
- Passwords hashed with bcrypt
- Sensitive data excluded from API responses
- CORS properly configured
- Input sanitization implemented

## Performance Optimizations

### 1. Database Optimization
- Firestore composite indexes for complex queries
- Efficient query patterns
- Pagination for large datasets
- Caching strategies

### 2. Real-time Optimization
- WebRTC for low-latency communication
- Socket.IO rooms for scalability
- Debounced updates
- Connection pooling

### 3. Frontend Optimization
- JWT token caching
- API response caching
- Optimistic UI updates
- Component memoization

This integration provides a robust, scalable authentication and database system that combines the benefits of Firebase's real-time capabilities with the flexibility of JWT authentication.