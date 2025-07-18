import React, { useState, useEffect } from 'react';
import { documentService } from '../services/api';

const ShareModal = ({ isOpen, onClose, documentId, documentTitle, currentUser }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && documentId) {
      fetchCollaborators();
    }
  }, [isOpen, documentId]);

  const fetchCollaborators = async () => {
    try {
      const response = await documentService.getCollaborators(documentId);
      setCollaborators(response.collaborators);
    } catch (err) {
      setError('Failed to fetch collaborators');
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await documentService.searchUsers(query);
      setSearchResults(response.users);
    } catch (err) {
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInviteUser = async (userEmail, role = 'editor') => {
    setIsInviting(true);
    setError('');
    setSuccess('');

    try {
      await documentService.inviteUser(documentId, userEmail, role);
      setSuccess('User invited successfully!');
      setInviteEmail('');
      setSearchQuery('');
      setSearchResults([]);
      fetchCollaborators();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      await documentService.removeCollaborator(documentId, collaboratorId);
      setSuccess('Collaborator removed successfully!');
      fetchCollaborators();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove collaborator');
    }
  };

  const handleUpdateRole = async (collaboratorId, newRole) => {
    try {
      await documentService.updateCollaboratorRole(documentId, collaboratorId, newRole);
      setSuccess('Role updated successfully!');
      fetchCollaborators();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageUser = (collaborator) => {
    const currentUserRole = collaborators.find(c => c.userId === currentUser?.userId)?.role;
    return currentUserRole === 'owner' || 
           (currentUserRole === 'admin' && collaborator.role !== 'owner');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Share "{documentTitle}"
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {/* Success/Error Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Invite User Section */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3">Invite People</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => handleInviteUser(inviteEmail, inviteRole)}
                  disabled={!inviteEmail || isInviting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isInviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>

              {/* User Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  </div>
                )}
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.userId}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setInviteEmail(user.email);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Collaborators */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">
              People with access ({collaborators.length})
            </h3>
            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.userId}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {collaborator.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{collaborator.name}</div>
                      <div className="text-sm text-gray-600">{collaborator.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {collaborator.isOwner ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor('owner')}`}>
                        Owner
                      </span>
                    ) : (
                      <>
                        <select
                          value={collaborator.role}
                          onChange={(e) => handleUpdateRole(collaborator.userId, e.target.value)}
                          disabled={!canManageUser(collaborator)}
                          className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        {canManageUser(collaborator) && (
                          <button
                            onClick={() => handleRemoveCollaborator(collaborator.userId)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Remove collaborator"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Explanations */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Role Permissions</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Owner:</strong> Full access - can manage all settings and delete document</div>
              <div><strong>Admin:</strong> Can edit document and manage collaborators</div>
              <div><strong>Editor:</strong> Can view and edit document content</div>
              <div><strong>Viewer:</strong> Can only view document content</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;