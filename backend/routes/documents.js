const express = require('express');
const { db } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Input validation middleware
const validateDocument = (req, res, next) => {
  const { title, content } = req.body;
  
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required and must be a string' });
  }
  
  if (title.length < 1 || title.length > 255) {
    return res.status(400).json({ error: 'Title must be between 1 and 255 characters' });
  }
  
  if (content && typeof content !== 'string') {
    return res.status(400).json({ error: 'Content must be a string' });
  }
  
  if (content && content.length > 1000000) { // 1MB limit
    return res.status(400).json({ error: 'Content too large (max 1MB)' });
  }
  
  // Sanitize title (remove potentially dangerous characters)
  req.body.title = title.trim().replace(/[<>]/g, '');
  
  next();
};

// Enhanced error handling
const handleDatabaseError = (error, res) => {
  console.error('Database error:', error);
  
  if (error.code === 'PERMISSION_DENIED') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  if (error.code === 'NOT_FOUND') {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  if (error.code === 'ALREADY_EXISTS') {
    return res.status(409).json({ error: 'Document already exists' });
  }
  
  if (error.code === 'INVALID_ARGUMENT') {
    return res.status(400).json({ error: 'Invalid request data' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

router.use(authenticateToken);

router.post('/', validateDocument, async (req, res) => {
  try {
    const { title, content = '', isPublic = false } = req.body;
    const userId = req.user.userId;

    const documentData = {
      title,
      content,
      isPublic,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: [userId],
      permissions: {
        [userId]: 'owner'
      },
      activeUsers: [],
      lastActivity: new Date()
    };

    const docRef = await db.collection('documents').add(documentData);

    res.status(201).json({
      message: 'Document created successfully',
      document: {
        id: docRef.id,
        ...documentData
      }
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      search = '',
      isPublic,
      filterBy = 'all'
    } = req.query;

    // Validate query parameters
    const validatedPage = Math.max(1, parseInt(page));
    const validatedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const validatedSortBy = ['title', 'createdAt', 'updatedAt'].includes(sortBy) ? sortBy : 'updatedAt';
    const validatedSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

    const documentsRef = db.collection('documents');
    let query = documentsRef;

    // Apply filtering based on filterBy parameter
    if (filterBy === 'my-docs') {
      query = query.where('createdBy', '==', userId);
    } else if (filterBy === 'public') {
      query = query.where('isPublic', '==', true);
    } else if (filterBy === 'private') {
      query = query.where('createdBy', '==', userId).where('isPublic', '==', false);
    } else {
      // For 'all' documents, we need to get both user's documents and public documents
      const ownDocsSnapshot = await documentsRef.where('collaborators', 'array-contains', userId).get();
      const publicDocsSnapshot = await documentsRef.where('isPublic', '==', true).get();

      const documents = [];
      const addedDocIds = new Set();

      // Add user's own documents
      ownDocsSnapshot.forEach(doc => {
        const docData = doc.data();
        documents.push({
          id: doc.id,
          ...docData,
          canEdit: true,
          isOwner: docData.createdBy === userId
        });
        addedDocIds.add(doc.id);
      });

      // Add public documents (avoiding duplicates)
      publicDocsSnapshot.forEach(doc => {
        const docData = doc.data();
        if (!addedDocIds.has(doc.id)) {
          documents.push({
            id: doc.id,
            ...docData,
            canEdit: true,
            isOwner: docData.createdBy === userId
          });
        } else {
          // Update existing document to ensure it's marked as editable
          const existingDoc = documents.find(d => d.id === doc.id);
          if (existingDoc) {
            existingDoc.canEdit = true;
          }
        }
      });

      // Apply search filter
      let filteredDocuments = documents;
      if (search) {
        filteredDocuments = documents.filter(doc =>
          doc.title.toLowerCase().includes(search.toLowerCase()) ||
          (doc.content && doc.content.toLowerCase().includes(search.toLowerCase()))
        );
      }

      // Apply sorting
      filteredDocuments.sort((a, b) => {
        let aValue = a[validatedSortBy];
        let bValue = b[validatedSortBy];

        if (validatedSortBy === 'title') {
          aValue = aValue || '';
          bValue = bValue || '';
          return validatedSortOrder === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
        } else {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
          return validatedSortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        }
      });

      // Apply pagination
      const startIndex = (validatedPage - 1) * validatedLimit;
      const endIndex = startIndex + validatedLimit;
      const paginatedDocuments = filteredDocuments.slice(startIndex, endIndex);

      return res.json({
        documents: paginatedDocuments,
        pagination: {
          page: validatedPage,
          limit: validatedLimit,
          total: filteredDocuments.length,
          pages: Math.ceil(filteredDocuments.length / validatedLimit)
        }
      });
    }

    // For specific filters (my-docs, public, private), use simpler query
    const snapshot = await query.orderBy(validatedSortBy, validatedSortOrder).get();
    
    let documents = [];
    snapshot.forEach(doc => {
      const docData = doc.data();
      documents.push({
        id: doc.id,
        ...docData,
        canEdit: docData.collaborators.includes(userId) || docData.isPublic,
        isOwner: docData.createdBy === userId
      });
    });

    // Apply search filter
    if (search) {
      documents = documents.filter(doc =>
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        (doc.content && doc.content.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Apply pagination
    const startIndex = (validatedPage - 1) * validatedLimit;
    const endIndex = startIndex + validatedLimit;
    const paginatedDocuments = documents.slice(startIndex, endIndex);

    res.json({
      documents: paginatedDocuments,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: documents.length,
        pages: Math.ceil(documents.length / validatedLimit)
      }
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Get all public documents - MUST be before /:id route
router.get('/public', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const publicDocsSnapshot = await db.collection('documents')
      .where('isPublic', '==', true)
      .orderBy('updatedAt', 'desc')
      .get();

    const documents = [];
    publicDocsSnapshot.forEach(doc => {
      const docData = doc.data();
      documents.push({
        id: doc.id,
        ...docData,
        canEdit: true, // All authenticated users can edit public documents
        isOwner: docData.createdBy === userId
      });
    });

    res.json({ documents });
  } catch (error) {
    console.error('Get public documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // Allow access if user is collaborator OR document is public
    const hasAccess = documentData.collaborators.includes(userId) || documentData.isPublic;
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      document: {
        id: doc.id,
        ...documentData
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', validateDocument, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.userId;

    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // Allow editing if user is collaborator OR document is public
    const canEdit = documentData.collaborators.includes(userId) || documentData.isPublic;
    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    await docRef.update(updateData);

    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    if (documentData.createdBy !== userId) {
      return res.status(403).json({ error: 'Only the owner can delete this document' });
    }

    await docRef.delete();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Search users for invitation
router.get('/search/users', async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.userId;

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Search users by email or name
    const usersRef = db.collection('users');
    const emailQuery = await usersRef.where('email', '>=', query).where('email', '<=', query + '\uf8ff').limit(10).get();
    const nameQuery = await usersRef.where('name', '>=', query).where('name', '<=', query + '\uf8ff').limit(10).get();

    const users = new Map();
    
    // Process email results
    emailQuery.forEach(doc => {
      const userData = doc.data();
      if (userData.userId !== userId) { // Exclude current user
        users.set(doc.id, {
          userId: userData.userId,
          email: userData.email,
          name: userData.name
        });
      }
    });

    // Process name results
    nameQuery.forEach(doc => {
      const userData = doc.data();
      if (userData.userId !== userId) { // Exclude current user
        users.set(doc.id, {
          userId: userData.userId,
          email: userData.email,
          name: userData.name
        });
      }
    });

    res.json({ users: Array.from(users.values()) });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite user to document
router.post('/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail, role = 'editor' } = req.body;
    const userId = req.user.userId;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // Check if user is owner or admin
    if (documentData.createdBy !== userId && documentData.permissions?.[userId] !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can invite users' });
    }

    // Find user by email
    const userQuery = await db.collection('users').where('email', '==', userEmail).limit(1).get();
    
    if (userQuery.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const invitedUser = userQuery.docs[0].data();
    const invitedUserId = invitedUser.userId;

    // Check if user is already a collaborator
    if (documentData.collaborators?.includes(invitedUserId)) {
      return res.status(400).json({ error: 'User is already a collaborator' });
    }

    // Update document with new collaborator
    await docRef.update({
      collaborators: [...(documentData.collaborators || []), invitedUserId],
      permissions: {
        ...(documentData.permissions || {}),
        [invitedUserId]: role
      },
      updatedAt: new Date()
    });

    res.json({ 
      message: 'User invited successfully',
      invitedUser: {
        userId: invitedUserId,
        email: invitedUser.email,
        name: invitedUser.name,
        role
      }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove user from document
router.delete('/:id/collaborators/:collaboratorId', async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user.userId;

    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // Check if user is owner or admin
    if (documentData.createdBy !== userId && documentData.permissions?.[userId] !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can remove collaborators' });
    }

    // Can't remove the owner
    if (collaboratorId === documentData.createdBy) {
      return res.status(400).json({ error: 'Cannot remove document owner' });
    }

    // Update document
    const newCollaborators = documentData.collaborators?.filter(id => id !== collaboratorId) || [];
    const newPermissions = { ...documentData.permissions };
    delete newPermissions[collaboratorId];

    await docRef.update({
      collaborators: newCollaborators,
      permissions: newPermissions,
      updatedAt: new Date()
    });

    res.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role
router.put('/:id/collaborators/:collaboratorId/role', async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const { role } = req.body;
    const userId = req.user.userId;

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // Check if user is owner or admin
    if (documentData.createdBy !== userId && documentData.permissions?.[userId] !== 'admin') {
      return res.status(403).json({ error: 'Only owners and admins can change roles' });
    }

    // Can't change owner role
    if (collaboratorId === documentData.createdBy) {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }

    // Update role
    await docRef.update({
      [`permissions.${collaboratorId}`]: role,
      updatedAt: new Date()
    });

    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get document collaborators
router.get('/:id/collaborators', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const docRef = db.collection('documents').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const documentData = doc.data();

    // Check access
    if (!documentData.collaborators?.includes(userId) && !documentData.isPublic) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get collaborator details
    const collaborators = [];
    if (documentData.collaborators) {
      for (const collaboratorId of documentData.collaborators) {
        const userQuery = await db.collection('users').where('userId', '==', collaboratorId).limit(1).get();
        if (!userQuery.empty) {
          const userData = userQuery.docs[0].data();
          collaborators.push({
            userId: collaboratorId,
            email: userData.email,
            name: userData.name,
            role: documentData.permissions?.[collaboratorId] || 'viewer',
            isOwner: collaboratorId === documentData.createdBy
          });
        }
      }
    }

    res.json({ collaborators });
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;