const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all comments for a document
router.get('/document/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.userId;

    // First verify user has access to the document
    const docRef = db.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();
    const hasAccess = documentData.collaborators.includes(userId) || documentData.isPublic;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get comments for the document
    const commentsSnapshot = await db.collection('comments')
      .where('documentId', '==', documentId)
      .get();

    const comments = [];
    commentsSnapshot.forEach(doc => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new comment or suggestion
router.post('/', async (req, res) => {
  try {
    const { documentId, text, selectedText, range, position, type, suggestedText } = req.body;
    const userId = req.user.userId;
    const userName = req.user.name;

    if (!documentId || !text) {
      return res.status(400).json({ error: 'Document ID and text are required' });
    }

    if (type === 'comment' && !selectedText) {
      return res.status(400).json({ error: 'Selected text is required for comments' });
    }

    if (type === 'suggestion' && (!selectedText || !suggestedText)) {
      return res.status(400).json({ error: 'Selected text and suggested text are required for suggestions' });
    }

    // Verify user has access to the document
    const docRef = db.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();
    const hasAccess = documentData.collaborators.includes(userId) || documentData.isPublic;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create comment or suggestion
    const commentData = {
      documentId,
      text: text.trim(),
      selectedText: selectedText || null,
      range: range || null,
      position: position || null,
      type: type || 'comment',
      suggestedText: suggestedText || null,
      author: userName,
      authorId: userId,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: type === 'suggestion' ? 'pending' : 'active',
      isResolved: false
    };

    const commentRef = await db.collection('comments').add(commentData);

    // Update document's last activity
    await docRef.update({
      lastActivity: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({
      message: `${type === 'suggestion' ? 'Suggestion' : 'Comment'} added successfully`,
      comment: {
        id: commentRef.id,
        ...commentData
      }
    });
  } catch (error) {
    console.error('Add comment/suggestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a comment
router.put('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const commentRef = db.collection('comments').doc(commentId);
    const comment = await commentRef.get();

    if (!comment.exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentData = comment.data();

    // Only the author can update their comment
    if (commentData.authorId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    // Update comment
    await commentRef.update({
      text: text.trim(),
      updatedAt: new Date()
    });

    res.json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a comment
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const commentRef = db.collection('comments').doc(commentId);
    const comment = await commentRef.get();

    if (!comment.exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentData = comment.data();

    // Only the author can delete their comment
    if (commentData.authorId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    // Delete comment
    await commentRef.delete();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.userId;

    // Users can only see their own comments or public comments
    if (userId !== requestingUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const commentsSnapshot = await db.collection('comments')
      .where('authorId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const comments = [];
    commentsSnapshot.forEach(doc => {
      comments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ comments });
  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept or reject a suggestion OR resolve a comment
router.put('/:commentId/resolve', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { action } = req.body; // 'accept' or 'reject' for suggestions, undefined for comments
    const userId = req.user.userId;

    const commentRef = db.collection('comments').doc(commentId);
    const comment = await commentRef.get();

    if (!comment.exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentData = comment.data();

    // Verify user has access to the document
    const docRef = db.collection('documents').doc(commentData.documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();
    const canResolve = documentData.collaborators.includes(userId) || documentData.isPublic;
    
    if (!canResolve) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (commentData.type === 'suggestion') {
      // Handle suggestion resolution
      if (!action || !['accept', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Action must be accept or reject for suggestions' });
      }

      await commentRef.update({
        status: action === 'accept' ? 'accepted' : 'rejected',
        isResolved: true,
        resolvedBy: userId,
        resolvedAt: new Date(),
        updatedAt: new Date()
      });

      res.json({
        message: `Suggestion ${action}ed successfully`,
        action,
        suggestionId: commentId
      });
    } else {
      // Handle comment resolution
      await commentRef.update({
        isResolved: true,
        resolvedBy: userId,
        resolvedAt: new Date(),
        updatedAt: new Date()
      });

      res.json({ message: 'Comment resolved successfully' });
    }
  } catch (error) {
    console.error('Resolve comment/suggestion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add reply to comment
router.post('/:commentId/reply', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId;
    const userName = req.user.name;

    if (!text) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const parentCommentRef = db.collection('comments').doc(commentId);
    const parentComment = await parentCommentRef.get();

    if (!parentComment.exists) {
      return res.status(404).json({ error: 'Parent comment not found' });
    }

    const parentCommentData = parentComment.data();

    // Verify user has access to the document
    const docRef = db.collection('documents').doc(parentCommentData.documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();
    const hasAccess = documentData.collaborators.includes(userId) || documentData.isPublic;
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create reply
    const replyData = {
      documentId: parentCommentData.documentId,
      text: text.trim(),
      type: 'reply',
      parentCommentId: commentId,
      author: userName,
      authorId: userId,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const replyRef = await db.collection('comments').add(replyData);

    res.status(201).json({
      message: 'Reply added successfully',
      reply: {
        id: replyRef.id,
        ...replyData
      }
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;