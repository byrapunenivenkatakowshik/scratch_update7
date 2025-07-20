import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { commentService } from '../services/api';
import Comment from './Comment';
import '../styles/CommentSidebar.css';

const CommentSidebar = ({ documentId, isVisible, onClose, socket }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  const { user } = useAuth();
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isVisible && documentId) {
      fetchComments();
    }
  }, [isVisible, documentId]);

  // Set up real-time socket listeners
  useEffect(() => {
    if (!socket || !isVisible) return;

    const handleCommentAdded = (data) => {
      if (data.comment && data.comment.documentId === documentId) {
        setComments(prev => [data.comment, ...prev]);
      }
    };

    const handleCommentUpdated = (data) => {
      if (data.comment && data.comment.documentId === documentId) {
        setComments(prev => prev.map(comment => 
          comment.id === data.comment.id ? data.comment : comment
        ));
      }
    };

    const handleCommentDeleted = (data) => {
      if (data.documentId === documentId) {
        setComments(prev => prev.filter(comment => comment.id !== data.commentId));
      }
    };

    const handleCommentResolved = (data) => {
      if (data.documentId === documentId) {
        setComments(prev => prev.map(comment => 
          comment.id === data.commentId 
            ? { 
                ...comment, 
                isResolved: data.isResolved,
                resolvedAt: data.isResolved ? new Date().toISOString() : null,
                resolvedBy: data.isResolved ? data.resolvedBy : null 
              }
            : comment
        ));
      }
    };

    socket.on('comment-added', handleCommentAdded);
    socket.on('comment-updated', handleCommentUpdated);
    socket.on('comment-deleted', handleCommentDeleted);
    socket.on('comment-resolved', handleCommentResolved);

    return () => {
      socket.off('comment-added', handleCommentAdded);
      socket.off('comment-updated', handleCommentUpdated);
      socket.off('comment-deleted', handleCommentDeleted);
      socket.off('comment-resolved', handleCommentResolved);
    };
  }, [socket, isVisible, documentId]);

  useEffect(() => {
    if (isVisible && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isVisible]);

  const fetchComments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await commentService.getComments(documentId);
      setComments(response.comments || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      const response = await commentService.addComment(documentId, newComment.trim());
      setComments(prev => [response.comment, ...prev]);
      setNewComment('');
      
      // Broadcast the new comment to other users
      if (socket) {
        socket.emit('comment-added', { documentId, comment: response.comment });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId, content) => {
    try {
      await commentService.updateComment(commentId, content);
      const updatedComment = comments.find(c => c.id === commentId);
      const newComment = { ...updatedComment, content, updatedAt: new Date().toISOString() };
      
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? newComment : comment
      ));
      
      // Broadcast the updated comment to other users
      if (socket) {
        socket.emit('comment-updated', { documentId, comment: newComment });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update comment');
      throw err;
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      // Broadcast the deleted comment to other users
      if (socket) {
        socket.emit('comment-deleted', { documentId, commentId });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete comment');
      throw err;
    }
  };

  const handleResolveComment = async (commentId, isResolved) => {
    try {
      await commentService.resolveComment(commentId, isResolved);
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              isResolved, 
              resolvedAt: isResolved ? new Date().toISOString() : null,
              resolvedBy: isResolved ? user?.userId : null 
            }
          : comment
      ));
      
      // Broadcast the resolved comment to other users
      if (socket) {
        socket.emit('comment-resolved', { 
          documentId, 
          commentId, 
          isResolved,
          resolvedBy: user?.userId 
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resolve comment');
      throw err;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAddComment(e);
    }
  };

  const filteredComments = comments.filter(comment => 
    showResolved || !comment.isResolved
  );

  const resolvedCount = comments.filter(comment => comment.isResolved).length;
  const unresolvedCount = comments.filter(comment => !comment.isResolved).length;

  if (!isVisible) return null;

  return (
    <div className="comment-sidebar-overlay">
      <div className="comment-sidebar">
        <div className="comment-sidebar-header">
          <h3 className="comment-sidebar-title">Comments</h3>
          <button 
            onClick={onClose}
            className="comment-sidebar-close"
            aria-label="Close comments"
          >
            ×
          </button>
        </div>

        <div className="comment-sidebar-stats">
          <div className="comment-stats">
            <span className="comment-stat">
              {unresolvedCount} open
            </span>
            {resolvedCount > 0 && (
              <span className="comment-stat">
                {resolvedCount} resolved
              </span>
            )}
          </div>
          {resolvedCount > 0 && (
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="comment-toggle-resolved"
            >
              {showResolved ? 'Hide' : 'Show'} resolved
            </button>
          )}
        </div>

        <form onSubmit={handleAddComment} className="comment-form">
          <div className="comment-form-header">
            <div className="comment-form-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="comment-form-user">
              {user?.name || 'Anonymous'}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a comment..."
            className="comment-form-textarea"
            rows="3"
            disabled={isSubmitting}
          />
          <div className="comment-form-actions">
            <div className="comment-form-hint">
              Press Ctrl+Enter to post
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="comment-form-submit"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>

        {error && (
          <div className="comment-error">
            {error}
          </div>
        )}

        <div className="comment-list">
          {isLoading ? (
            <div className="comment-loading">
              <div className="comment-loading-spinner"></div>
              <span>Loading comments...</span>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="comment-empty">
              <div className="comment-empty-icon">💬</div>
              <p className="comment-empty-text">
                {comments.length === 0 
                  ? 'No comments yet. Be the first to comment!' 
                  : showResolved 
                    ? 'No comments to show.' 
                    : 'No open comments. All comments are resolved!'}
              </p>
            </div>
          ) : (
            filteredComments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
                onResolve={handleResolveComment}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSidebar;