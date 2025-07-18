import React, { useState } from 'react';

const InlineComment = ({ comment, onResolve, onReply, currentUser, className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);

  const handleResolve = () => {
    onResolve(comment.id);
  };

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(comment.id, replyText);
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const getCommentColor = (type, status) => {
    if (type === 'suggestion') {
      switch (status) {
        case 'accepted':
          return 'bg-green-200 border-green-400';
        case 'rejected':
          return 'bg-red-200 border-red-400';
        default:
          return 'bg-blue-200 border-blue-400';
      }
    }
    return 'bg-yellow-200 border-yellow-400';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <span className="relative inline-block">
      <span
        className={`${getCommentColor(comment.type, comment.status)} ${className} border-b-2 cursor-pointer transition-all duration-200 hover:shadow-sm`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        {comment.selectedText}
      </span>
      
      {showTooltip && (
        <div className="absolute z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 top-full left-0 mt-2">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{comment.author}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                comment.type === 'suggestion' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {comment.type === 'suggestion' ? 'Suggestion' : 'Comment'}
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
          
          <p className="text-gray-800 mb-3">{comment.text}</p>
          
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
                  onClick={() => onResolve(comment.id, 'accept')}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => onResolve(comment.id, 'reject')}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                >
                  Reject
                </button>
              </>
            )}
            
            {comment.type === 'comment' && !comment.isResolved && (
              <button
                onClick={handleResolve}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
              >
                Resolve
              </button>
            )}
            
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
            >
              Reply
            </button>
          </div>
          
          {showReplyInput && (
            <div className="mt-3 border-t pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add a reply..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleReply();
                    }
                  }}
                />
                <button
                  onClick={handleReply}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
};

export default InlineComment;