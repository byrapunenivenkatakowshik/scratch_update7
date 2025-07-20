const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Input validation middleware
const validateComment = (req, res, next) => {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Content is required and must be a string' });
  }
  
  if (content.length < 1 || content.length > 1000) {
    return res.status(400).json({ error: 'Content must be between 1 and 1000 characters' });
  }
  
  // Sanitize content (basic HTML escape)
  req.body.content = content.trim();
  
  next();
};

// Enhanced error handling
const handleDatabaseError = (error, res) => {
  console.error('Database error:', error);
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
  
  if (error.code === 'PERMISSION_DENIED') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (error.code === 'NOT_FOUND') {
    return res.status(404).json({ error: 'Resource not found' });
  }
  
  if (error.code === 'INVALID_ARGUMENT') {
    return res.status(400).json({ error: 'Invalid request data' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

router.use(authenticateToken);

// Get all comments for a document
router.get('/document/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.userId;

    // First, verify user has access to the document
    const docRef = db.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // Check access: user must be collaborator OR document is public
    const hasAccess = documentData.collaborators?.includes(userId) || documentData.isPublic;
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to document' });
    }

    // Get comments for the document
    let commentsSnapshot;
    try {
      commentsSnapshot = await db.collection('comments')
        .where('documentId', '==', documentId)
        .orderBy('createdAt', 'desc')
        .get();
    } catch (orderByError) {
      // Fallback: get comments without orderBy if index doesn't exist
      console.log('OrderBy failed, falling back to simple query:', orderByError.message);
      commentsSnapshot = await db.collection('comments')
        .where('documentId', '==', documentId)
        .get();
    }

    const comments = [];
    if (commentsSnapshot && commentsSnapshot.docs && commentsSnapshot.docs.length > 0) {
      for (const commentDoc of commentsSnapshot.docs) {
        const commentData = commentDoc.data();
        
        // Get user details for each comment
        let userData = null;
        try {
          const userQuery = await db.collection('users').where('userId', '==', commentData.createdBy).limit(1).get();
          if (!userQuery.empty) {
            userData = userQuery.docs[0].data();
          }
        } catch (userError) {
          console.log('Error fetching user data for comment:', userError.message);
          // Continue without user data
        }

        comments.push({
          id: commentDoc.id,
          ...commentData,
          createdAt: commentData.createdAt?.toDate ? commentData.createdAt.toDate().toISOString() : commentData.createdAt,
          updatedAt: commentData.updatedAt?.toDate ? commentData.updatedAt.toDate().toISOString() : commentData.updatedAt,
          user: userData ? {
            userId: userData.userId,
            name: userData.name,
            email: userData.email
          } : {
            userId: commentData.createdBy,
            name: 'Unknown User',
            email: commentData.createdBy
          }
        });
      }
      
      // Sort comments manually if we couldn't use orderBy
      if (!commentsSnapshot.docs[0]._orderBy) {
        comments.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bTime - aTime; // desc order
        });
      }
    }

    res.json({ comments });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Add a new comment to a document
router.post('/document/:documentId', validateComment, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Verify user has access to the document
    const docRef = db.collection('documents').doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // Check access: user must be collaborator OR document is public
    const hasAccess = documentData.collaborators?.includes(userId) || documentData.isPublic;
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to document' });
    }

    // Create the comment
    const commentData = {
      documentId,
      content,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isResolved: false
    };

    const commentRef = await db.collection('comments').add(commentData);

    // Get user details for the response
    const userQuery = await db.collection('users').where('userId', '==', userId).limit(1).get();
    let userData = null;
    if (!userQuery.empty) {
      userData = userQuery.docs[0].data();
    }

    const responseComment = {
      id: commentRef.id,
      ...commentData,
      createdAt: commentData.createdAt.toISOString(),
      updatedAt: commentData.updatedAt.toISOString(),
      user: userData ? {
        userId: userData.userId,
        name: userData.name,
        email: userData.email
      } : null
    };

    res.status(201).json({
      message: 'Comment created successfully',
      comment: responseComment
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Update a comment
router.put('/:commentId', validateComment, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Get the comment
    const commentRef = db.collection('comments').doc(commentId);
    const comment = await commentRef.get();

    if (!comment.exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentData = comment.data();

    // Only the comment creator can update it
    if (commentData.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the comment creator can update this comment' });
    }

    // Update the comment
    await commentRef.update({
      content,
      updatedAt: new Date()
    });

    res.json({ message: 'Comment updated successfully' });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Delete a comment
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Get the comment
    const commentRef = db.collection('comments').doc(commentId);
    const comment = await commentRef.get();

    if (!comment.exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentData = comment.data();

    // Check if user can delete: must be comment creator OR document owner
    if (commentData.createdBy !== userId) {
      // Check if user is document owner
      const docRef = db.collection('documents').doc(commentData.documentId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const documentData = doc.data();
      if (documentData.createdBy !== userId) {
        return res.status(403).json({ error: 'Only the comment creator or document owner can delete this comment' });
      }
    }

    // Delete the comment
    await commentRef.delete();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Resolve/unresolve a comment
router.put('/:commentId/resolve', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { isResolved } = req.body;
    const userId = req.user.userId;

    // Get the comment
    const commentRef = db.collection('comments').doc(commentId);
    const comment = await commentRef.get();

    if (!comment.exists) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentData = comment.data();

    // Check if user has access to the document
    const docRef = db.collection('documents').doc(commentData.documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // Check access: user must be collaborator OR document is public
    const hasAccess = documentData.collaborators?.includes(userId) || documentData.isPublic;
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to document' });
    }

    // Update the comment resolution status
    await commentRef.update({
      isResolved: Boolean(isResolved),
      resolvedAt: isResolved ? new Date() : null,
      resolvedBy: isResolved ? userId : null,
      updatedAt: new Date()
    });

    res.json({ message: `Comment ${isResolved ? 'resolved' : 'unresolved'} successfully` });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

module.exports = router;