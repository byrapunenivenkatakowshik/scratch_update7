import React, { useState, useEffect } from 'react';
import useSocket from '../hooks/useSocket';
import { commentService } from '../services/api';

const CommentPanel = ({ documentId, comments, onCommentAdd, onCommentResolve, onSuggestionResolve, onReplyAdd, currentUser, selectedText: propSelectedText, selectedRange, commentType: propCommentType, selectionType }) => {
  const [newComment, setNewComment] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [commentType, setCommentType] = useState('comment');
  const [suggestedText, setSuggestedText] = useState('');
  const [replyInputs, setReplyInputs] = useState({});
  const [showResolved, setShowResolved] = useState(false);
  const { socket, isInitialized } = useSocket();

  // Update selected text and comment type when props change
  useEffect(() => {
    if (propSelectedText) {
      setSelectedText(propSelectedText);
    }
  }, [propSelectedText]);

  // Update comment type when it changes from EditorPage
  useEffect(() => {
    if (propCommentType) {
      setCommentType(propCommentType);
    }
  }, [propCommentType]);

  // Auto-focus and scroll to form when text is selected
  useEffect(() => {
    if (propSelectedText && selectedRange) {
      // Auto-focus on the comment text area when text is selected
      setTimeout(() => {
        const textArea = document.querySelector('textarea[placeholder*="Add your comment"], textarea[placeholder*="Explain your suggestion"]');
        if (textArea) {
          textArea.focus();
          // Scroll to the form
          textArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [propSelectedText, selectedRange]);

  // Group comments by type and status
  const activeComments = comments.filter(comment => !comment.isResolved && comment.type !== 'reply');
  const resolvedComments = comments.filter(comment => comment.isResolved && comment.type !== 'reply');
  const replies = comments.filter(comment => comment.type === 'reply');

  // Get replies for a specific comment
  const getReplies = (commentId) => {
    return replies.filter(reply => reply.parentCommentId === commentId);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    if (!selectedText.trim()) {
      alert('Please select some text to add a suggestion');
      return;
    }

    if (!selectedText.trim() || !suggestedText.trim()) {
      alert('Please select text and provide a suggestion');
      return;
    }

    try {
      const response = await commentService.addComment(
        documentId,
        newComment,
        selectedText,
        selectedRange,
        null,
        commentType,
        commentType === 'suggestion' ? suggestedText : null
      );
      
      if (response.comment) {
        onCommentAdd(response.comment);
        
        // Emit socket event for real-time sync
        if (socket && isInitialized) {
          socket.emit('suggestion-added', {
            documentId,
            suggestion: response.comment
          });
        }
      }

      // Reset form
      setNewComment('');
      setSelectedText('');
      setSuggestedText('');
      setCommentType('comment');
      
      // Clear form after successful submission
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleResolve = async (commentId, isComment = true) => {
    try {
      await commentService.resolveComment(commentId);
      
      if (isComment) {
        onCommentResolve(commentId);
        
        // Emit socket event
        if (socket && isInitialized) {
          socket.emit('comment-resolved', {
            documentId,
            commentId
          });
        }
      }
    } catch (error) {
      console.error('Error resolving comment:', error);
      alert('Failed to resolve comment');
    }
  };

  const handleSuggestionAction = async (suggestionId, action) => {
    try {
      await commentService.resolveComment(suggestionId, action);
      
      onSuggestionResolve(suggestionId, action);
      
      // Emit socket event
      if (socket && isInitialized) {
        socket.emit('suggestion-resolved', {
          documentId,
          suggestionId,
          action
        });
      }
    } catch (error) {
      console.error('Error resolving suggestion:', error);
      alert('Failed to resolve suggestion');
    }
  };

  const handleAddReply = async (commentId) => {
    const replyText = replyInputs[commentId];
    if (!replyText?.trim()) return;

    try {
      const response = await commentService.addReply(commentId, replyText);
      
      if (response.reply) {
        onReplyAdd(response.reply);
        
        // Emit socket event
        if (socket && isInitialized) {
          socket.emit('reply-added', {
            documentId,
            reply: response.reply
          });
        }
      }

      // Clear reply input
      setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply');
    }
  };

  const handleReplyInputChange = (commentId, value) => {
    setReplyInputs(prev => ({ ...prev, [commentId]: value }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = (comment) => {
    const commentReplies = getReplies(comment.id);
    const isOwner = comment.authorId === currentUser?.userId;
    
    return (
      <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{comment.author}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              comment.type === 'suggestion' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              Suggestion
            </span>
            {comment.status && (
              <span className={`px-2 py-1 text-xs rounded-full ${
                comment.status === 'accepted' 
                  ? 'bg-green-100 text-green-800'
                  : comment.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {comment.status}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">{formatDate(comment.createdAt)}</span>
        </div>
        
        {comment.selectedText && (
          <div className="bg-gray-50 border-l-4 border-blue-500 p-3 mb-3">
            <p className="text-sm text-gray-700 font-medium">Selected text:</p>
            <p className="text-sm text-gray-600 italic">"{comment.selectedText}"</p>
          </div>
        )}
        
        <p className="text-gray-800 mb-3" style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}>{comment.text}</p>
        
        {comment.type === 'suggestion' && comment.suggestedText && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-3">
            <p className="text-sm text-gray-700 font-medium">Suggested change:</p>
            <p className="text-sm text-gray-600">"{comment.suggestedText}"</p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 items-center">
          {comment.type === 'suggestion' && comment.status === 'pending' && (
            <>
              <button
                onClick={() => handleSuggestionAction(comment.id, 'accept')}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleSuggestionAction(comment.id, 'reject')}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
                Reject
              </button>
            </>
          )}
          
          {comment.type === 'comment' && !comment.isResolved && (
            <button
              onClick={() => handleResolve(comment.id)}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
            >
              Resolve
            </button>
          )}
          
          <button
            onClick={() => setReplyInputs(prev => ({ 
              ...prev, 
              [comment.id]: prev[comment.id] || '' 
            }))}
            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            Reply
          </button>
        </div>
        
        {/* Reply input */}
        {replyInputs[comment.id] !== undefined && (
          <div className="mt-3 border-t pt-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={replyInputs[comment.id]}
                onChange={(e) => handleReplyInputChange(comment.id, e.target.value)}
                placeholder="Add a reply..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddReply(comment.id);
                  }
                }}
              />
              <button
                onClick={() => handleAddReply(comment.id)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Reply
              </button>
            </div>
          </div>
        )}
        
        {/* Replies */}
        {commentReplies.length > 0 && (
          <div className="mt-3 border-t pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Replies:</h4>
            {commentReplies.map(reply => (
              <div key={reply.id} className="bg-gray-50 p-3 rounded-md mb-2">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-gray-900">{reply.author}</span>
                  <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-800">{reply.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 h-full overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions</h3>
        
        {/* Add new comment/suggestion form */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-4">
          {propSelectedText && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm font-medium text-blue-800">
                ✅ {selectionType === 'block' ? 'Block' : 'Text'} selected for {propCommentType || 'comment'}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                "{propSelectedText.length > 100 ? propSelectedText.substring(0, 100) + '...' : propSelectedText}"
              </p>
              {selectionType === 'block' && (
                <p className="text-xs text-blue-500 mt-1">
                  📝 Entire block selected - perfect for commenting on structure or content
                </p>
              )}
            </div>
          )}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Type:</label>
            <div className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-blue-800 font-medium text-sm">
              💡 Suggestion
            </div>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text to change:
            </label>
            <input
              type="text"
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              placeholder="Select text from the document..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {commentType === 'suggestion' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Suggested text:</label>
              <textarea
                value={suggestedText}
                onChange={(e) => setSuggestedText(e.target.value)}
                placeholder="Enter your suggested text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                rows="3"
                style={{
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              />
            </div>
          )}
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation:
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder='Explain your suggestion...'
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              rows="4"
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            />
          </div>
          
          <button
            onClick={handleAddComment}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Add Suggestion
          </button>
        </div>
      </div>
      
      {/* Toggle resolved comments */}
      <div className="mb-4">
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showResolved ? 'Hide' : 'Show'} resolved ({resolvedComments.length})
        </button>
      </div>
      
      {/* Active comments */}
      <div className="space-y-4">
        {activeComments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active suggestions</p>
        ) : (
          activeComments.map(renderComment)
        )}
      </div>
      
      {/* Resolved comments */}
      {showResolved && resolvedComments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-700 mb-4">Resolved</h4>
          <div className="space-y-4 opacity-75">
            {resolvedComments.map(renderComment)}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentPanel;