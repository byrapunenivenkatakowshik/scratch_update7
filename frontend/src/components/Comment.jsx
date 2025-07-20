import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Comment = ({ comment, onUpdate, onDelete, onResolve }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleEdit = async () => {
    if (editContent.trim() === comment.content.trim()) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setIsLoading(true);
      try {
        await onDelete(comment.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResolve = async () => {
    setIsLoading(true);
    try {
      await onResolve(comment.id, !comment.isResolved);
    } catch (error) {
      console.error('Error resolving comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return commentDate.toLocaleDateString();
    }
  };

  const canEdit = user?.userId === comment.createdBy;
  const canDelete = user?.userId === comment.createdBy;

  return (
    <div className={`comment-item ${comment.isResolved ? 'comment-resolved' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <div className="comment-avatar">
            {comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="comment-author-info">
            <div className="comment-author-name">
              {comment.user?.name || 'Unknown User'}
            </div>
            <div className="comment-timestamp">
              {formatDate(comment.createdAt)}
              {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                <span className="comment-edited"> • edited</span>
              )}
            </div>
          </div>
        </div>
        <div className="comment-actions">
          {comment.isResolved && (
            <span className="comment-resolved-badge">Resolved</span>
          )}
          <button
            onClick={handleResolve}
            disabled={isLoading}
            className={`comment-resolve-btn ${comment.isResolved ? 'resolved' : ''}`}
            title={comment.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
          >
            {comment.isResolved ? '✓' : '○'}
          </button>
          {canEdit && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              disabled={isLoading}
              className="comment-edit-btn"
              title="Edit comment"
            >
              ✏️
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="comment-delete-btn"
              title="Delete comment"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="comment-content">
        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="comment-edit-textarea"
              rows="3"
              placeholder="Edit your comment..."
              disabled={isLoading}
            />
            <div className="comment-edit-actions">
              <button
                onClick={handleEdit}
                disabled={isLoading || !editContent.trim()}
                className="comment-save-btn"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                disabled={isLoading}
                className="comment-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-text">
            {comment.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;