const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const commentRoutes = require('./routes/comments');
const { db } = require('./config/firebase');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store active users and document sessions
const activeUsers = new Map();
const documentSessions = new Map();
const webrtcSessions = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-document', async (data) => {
    const { documentId, userId, userName } = data;
    
    try {
      // Verify document access
      const docRef = db.collection('documents').doc(documentId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        socket.emit('error', { message: 'Document not found' });
        return;
      }

      const documentData = doc.data();
      
      // Check if user has access to document
      if (!documentData.isPublic && !documentData.collaborators.includes(userId)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Join the document room
      socket.join(documentId);
      
      // Track user session
      activeUsers.set(socket.id, { userId, userName, documentId });
      
      // Track document session
      if (!documentSessions.has(documentId)) {
        documentSessions.set(documentId, new Set());
      }
      documentSessions.get(documentId).add(socket.id);
      
      // Notify other users in the document
      const connectedUsers = Array.from(documentSessions.get(documentId))
        .map(socketId => activeUsers.get(socketId))
        .filter(user => user && user.userId !== userId);
      
      socket.to(documentId).emit('user-joined', { userId, userName });
      socket.emit('active-users', connectedUsers);
      
      // Notify all users about the updated active users list
      const allConnectedUsers = Array.from(documentSessions.get(documentId))
        .map(socketId => activeUsers.get(socketId))
        .filter(user => user);
      
      io.to(documentId).emit('active-users-updated', allConnectedUsers);
      
    } catch (error) {
      console.error('Join document error:', error);
      socket.emit('error', { message: 'Failed to join document' });
    }
  });

  socket.on('content-change', (data) => {
    const { documentId, content, userId } = data;
    const user = activeUsers.get(socket.id);
    
    if (user && user.documentId === documentId) {
      // Broadcast to other users in the same document
      socket.to(documentId).emit('content-updated', {
        content,
        userId,
        userName: user.userName,
        timestamp: new Date().toISOString()
      });
      
      // Auto-save to database (debounced)
      saveDocumentContent(documentId, content);
    }
  });

  socket.on('title-change', (data) => {
    const { documentId, title, userId } = data;
    const user = activeUsers.get(socket.id);
    
    if (user && user.documentId === documentId) {
      socket.to(documentId).emit('title-updated', {
        title,
        userId,
        userName: user.userName,
        timestamp: new Date().toISOString()
      });
      
      saveDocumentTitle(documentId, title);
    }
  });

  socket.on('cursor-position', (data) => {
    const { documentId, position, userId } = data;
    const user = activeUsers.get(socket.id);
    
    if (user && user.documentId === documentId) {
      // Update user's cursor position in activeUsers
      const updatedUser = { ...user, cursorPosition: position };
      activeUsers.set(socket.id, updatedUser);
      
      socket.to(documentId).emit('cursor-updated', {
        position,
        userId,
        userName: user.userName,
        timestamp: Date.now()
      });
    }
  });

  socket.on('mouse-position', (data) => {
    const { documentId, position, userId } = data;
    const user = activeUsers.get(socket.id);
    
    if (user && user.documentId === documentId) {
      // Update user's mouse position in activeUsers
      const updatedUser = { ...user, mousePosition: position };
      activeUsers.set(socket.id, updatedUser);
      
      socket.to(documentId).emit('mouse-updated', {
        position,
        userId,
        userName: user.userName,
        timestamp: Date.now()
      });
    }
  });

  // WebRTC Signaling Events
  socket.on('join-webrtc-room', (data) => {
    const { documentId, userId } = data;
    
    // Join WebRTC room
    socket.join(`webrtc-${documentId}`);
    
    // Track WebRTC session
    if (!webrtcSessions.has(documentId)) {
      webrtcSessions.set(documentId, new Set());
    }
    webrtcSessions.get(documentId).add(socket.id);
    
    // Notify other users in the WebRTC room
    socket.to(`webrtc-${documentId}`).emit('user-joined-webrtc', { userId });
    
    console.log(`User ${userId} joined WebRTC room for document ${documentId}`);
  });

  socket.on('leave-webrtc-room', (data) => {
    const { documentId, userId } = data;
    
    // Leave WebRTC room
    socket.leave(`webrtc-${documentId}`);
    
    // Remove from WebRTC session
    if (webrtcSessions.has(documentId)) {
      webrtcSessions.get(documentId).delete(socket.id);
      
      if (webrtcSessions.get(documentId).size === 0) {
        webrtcSessions.delete(documentId);
      }
    }
    
    // Notify other users
    socket.to(`webrtc-${documentId}`).emit('user-left-webrtc', { userId });
    
    console.log(`User ${userId} left WebRTC room for document ${documentId}`);
  });

  socket.on('webrtc-offer', (data) => {
    const { documentId, offer, targetPeer, userId } = data;
    
    // Forward offer to target peer
    socket.to(`webrtc-${documentId}`).emit('webrtc-offer', {
      offer,
      fromPeer: userId
    });
    
    console.log(`WebRTC offer from ${userId} to ${targetPeer} for document ${documentId}`);
  });

  socket.on('webrtc-answer', (data) => {
    const { documentId, answer, targetPeer, userId } = data;
    
    // Forward answer to target peer
    socket.to(`webrtc-${documentId}`).emit('webrtc-answer', {
      answer,
      fromPeer: userId
    });
    
    console.log(`WebRTC answer from ${userId} to ${targetPeer} for document ${documentId}`);
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const { documentId, candidate, targetPeer, userId } = data;
    
    // Forward ICE candidate to target peer
    socket.to(`webrtc-${documentId}`).emit('webrtc-ice-candidate', {
      candidate,
      fromPeer: userId
    });
    
    console.log(`ICE candidate from ${userId} to ${targetPeer} for document ${documentId}`);
  });

  // Comment and suggestion events
  socket.on('comment-added', (data) => {
    const { documentId, comment } = data;
    const user = activeUsers.get(socket.id);
    
    if (user && user.documentId === documentId) {
      // Broadcast to all users in the document
      io.to(documentId).emit('comment-added', {
        comment,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('suggestion-added', (data) => {
    const { documentId, suggestion } = data;
    const user = activeUsers.get(socket.id);
    
    if (user && user.documentId === documentId) {
      // Broadcast to all users in the document
      io.to(documentId).emit('suggestion-added', {
        suggestion,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('suggestion-resolved', (data) => {
    const { documentId, suggestionId, action } = data;
    const user = activeUsers.get(socket.id);
    
    if (user && user.documentId === documentId) {
      // Broadcast to all users in the document
      io.to(documentId).emit('suggestion-resolved', {
        suggestionId,
        action,
        resolvedBy: user.userId,
        resolvedByName: user.userName,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('comment-resolved', (data) => {
    const { documentId, commentId } = data;
    const user = activeUsers.get(socket.id);
    
    if (user && user.documentId === documentId) {
      // Broadcast to all users in the document
      io.to(documentId).emit('comment-resolved', {
        commentId,
        resolvedBy: user.userId,
        resolvedByName: user.userName,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('reply-added', (data) => {
    const { documentId, reply } = data;
    const user = activeUsers.get(socket.id);
    
    if (user && user.documentId === documentId) {
      // Broadcast to all users in the document
      io.to(documentId).emit('reply-added', {
        reply,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('disconnect', () => {
    const user = activeUsers.get(socket.id);
    
    if (user) {
      const { documentId, userId, userName } = user;
      
      // Remove from active users
      activeUsers.delete(socket.id);
      
      // Remove from document session
      if (documentSessions.has(documentId)) {
        documentSessions.get(documentId).delete(socket.id);
        
        // If no users left in document, clean up
        if (documentSessions.get(documentId).size === 0) {
          documentSessions.delete(documentId);
        }
      }
      
      // Remove from WebRTC session
      if (webrtcSessions.has(documentId)) {
        webrtcSessions.get(documentId).delete(socket.id);
        
        if (webrtcSessions.get(documentId).size === 0) {
          webrtcSessions.delete(documentId);
        }
        
        // Notify WebRTC users
        socket.to(`webrtc-${documentId}`).emit('user-left-webrtc', { userId });
      }
      
      // Notify other users
      socket.to(documentId).emit('user-left', { userId, userName });
      
      // Update active users list for remaining users
      if (documentSessions.has(documentId) && documentSessions.get(documentId).size > 0) {
        const remainingUsers = Array.from(documentSessions.get(documentId))
          .map(socketId => activeUsers.get(socketId))
          .filter(user => user);
        
        io.to(documentId).emit('active-users-updated', remainingUsers);
      }
    }
    
    console.log('User disconnected:', socket.id);
  });
});

// Debounced save functions
const saveTimers = new Map();

const saveDocumentContent = (documentId, content) => {
  if (saveTimers.has(documentId)) {
    clearTimeout(saveTimers.get(documentId));
  }
  
  const timer = setTimeout(async () => {
    try {
      await db.collection('documents').doc(documentId).update({
        content,
        updatedAt: new Date()
      });
      saveTimers.delete(documentId);
    } catch (error) {
      console.error('Auto-save content error:', error);
    }
  }, 2000);
  
  saveTimers.set(documentId, timer);
};

const saveDocumentTitle = (documentId, title) => {
  if (saveTimers.has(`${documentId}-title`)) {
    clearTimeout(saveTimers.get(`${documentId}-title`));
  }
  
  const timer = setTimeout(async () => {
    try {
      await db.collection('documents').doc(documentId).update({
        title,
        updatedAt: new Date()
      });
      saveTimers.delete(`${documentId}-title`);
    } catch (error) {
      console.error('Auto-save title error:', error);
    }
  }, 1000);
  
  saveTimers.set(`${documentId}-title`, timer);
};

app.get('/', (req, res) => {
  res.json({ message: 'Notion Clone API Server' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/comments', commentRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});