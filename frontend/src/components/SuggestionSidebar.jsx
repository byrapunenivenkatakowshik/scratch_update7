import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/CommentSidebar.css'; // Reusing comment styles for consistency

const SuggestionSidebar = ({ 
  suggestions = [], 
  currentUserId, 
  documentOwnerId, 
  onAcceptSuggestion, 
  onRejectSuggestion,
  isVisible,
  onClose,
  socket,
  documentId
}) => {
  const [localSuggestions, setLocalSuggestions] = useState(suggestions);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Update local suggestions when props change
  useEffect(() => {
    setLocalSuggestions(suggestions);
  }, [suggestions]);
  console.log('SuggestionSidebar props:', {
    suggestions,
    currentUserId,
    documentOwnerId,
    isVisible,
    suggestionsLength: suggestions.length,
    socketConnected: socket?.connected
  });

  // Check if current user is the document owner
  const isDocumentOwner = currentUserId === documentOwnerId;
  const pendingSuggestions = localSuggestions.filter(s => s.status === 'pending');
  const processedSuggestions = localSuggestions.filter(s => s.status !== 'pending');

  const handleAcceptSuggestionLocal = async (suggestionId) => {
    try {
      setError('');
      await onAcceptSuggestion(suggestionId);
      
      // Emit socket event to notify all users
      if (socket && documentId) {
        socket.emit('suggestion-resolved', {
          documentId,
          suggestionId,
          action: 'accepted'
        });
      }
    } catch (err) {
      setError('Failed to accept suggestion');
    }
  };

  const handleRejectSuggestionLocal = async (suggestionId) => {
    try {
      setError('');
      await onRejectSuggestion(suggestionId);
      
      // Emit socket event to notify all users
      if (socket && documentId) {
        socket.emit('suggestion-resolved', {
          documentId,
          suggestionId,
          action: 'rejected'
        });
      }
    } catch (err) {
      setError('Failed to reject suggestion');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="comment-sidebar-overlay">
      <div className="comment-sidebar">
        <div className="comment-sidebar-header">
          <h3 className="comment-sidebar-title">
            💡 Suggestions
          </h3>
          <button 
            onClick={onClose}
            className="comment-sidebar-close"
            aria-label="Close suggestions"
          >
            ×
          </button>
        </div>

        <div className="comment-sidebar-stats">
          <div className="comment-stats">
            <span className="comment-stat">
              {pendingSuggestions.length} pending
            </span>
            {processedSuggestions.length > 0 && (
              <span className="comment-stat">
                {processedSuggestions.length} processed
              </span>
            )}
          </div>
          {!isDocumentOwner && (
            <div className="text-sm text-gray-600 px-3 py-2 bg-blue-50 rounded-md">
              💡 Select text in the document to suggest changes
            </div>
          )}
        </div>

        {error && (
          <div className="comment-error">
            {error}
          </div>
        )}

        <div className="comment-list">
          {localSuggestions.length === 0 ? (
            <div className="comment-empty">
              <div className="comment-empty-icon">💡</div>
              <p className="comment-empty-text">
                {isDocumentOwner 
                  ? 'No suggestions yet. Collaborators can select text and suggest changes.'
                  : 'No suggestions yet. Select text in the document to suggest changes.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending Suggestions */}
              {pendingSuggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 px-3">
                    Pending Suggestions ({pendingSuggestions.length})
                  </h4>
                  {pendingSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isDocumentOwner={isDocumentOwner}
                      currentUserId={currentUserId}
                      onAccept={() => handleAcceptSuggestionLocal(suggestion.id)}
                      onReject={() => handleRejectSuggestionLocal(suggestion.id)}
                    />
                  ))}
                </div>
              )}

              {/* Processed Suggestions */}
              {processedSuggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 px-3">
                    Recent Activity ({processedSuggestions.length})
                  </h4>
                  {processedSuggestions.slice(0, 5).map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      isDocumentOwner={isDocumentOwner}
                      currentUserId={currentUserId}
                      onAccept={() => handleAcceptSuggestionLocal(suggestion.id)}
                      onReject={() => handleRejectSuggestionLocal(suggestion.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SuggestionCard = ({ suggestion, isDocumentOwner, currentUserId, onAccept, onReject }) => {
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const suggestionTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - suggestionTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className={`suggestion-card bg-white border rounded-lg p-4 mb-3 mx-3 ${
      suggestion.status === 'pending' ? 'border-blue-200 shadow-sm' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
            {suggestion.userName ? suggestion.userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="font-medium text-sm text-gray-900">
              {suggestion.userName || 'Anonymous'}
            </div>
            <div className="text-xs text-gray-500">
              {formatTimeAgo(suggestion.timestamp)}
            </div>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(suggestion.status)}`}>
          {getStatusIcon(suggestion.status)} {suggestion.status || 'pending'}
        </div>
      </div>

      {/* Original Text */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Original text:</div>
        <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800 line-through">
          "{suggestion.originalText}"
        </div>
      </div>

      {/* Suggested Text */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-1">Suggested change:</div>
        <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-800">
          "{suggestion.suggestionText}"
        </div>
      </div>

      {/* Action Buttons - Only show for document owner and pending suggestions */}
      {isDocumentOwner && suggestion.status === 'pending' && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={onAccept}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded-md transition-colors font-medium"
          >
            ✅ Accept
          </button>
          <button
            onClick={onReject}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-md transition-colors font-medium"
          >
            ❌ Reject
          </button>
        </div>
      )}

      {/* Status message for non-owners */}
      {!isDocumentOwner && suggestion.status === 'pending' && (
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            Waiting for document owner to review
          </div>
        </div>
      )}

      {/* Processed status */}
      {suggestion.status !== 'pending' && (
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-center">
            <span className={suggestion.status === 'approved' ? 'text-green-600' : 'text-red-600'}>
              {suggestion.status === 'approved' ? '✅ Accepted by document owner' : '❌ Rejected by document owner'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuggestionSidebar;