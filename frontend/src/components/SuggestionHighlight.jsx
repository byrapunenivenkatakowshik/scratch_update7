import React from 'react';

const SuggestionHighlight = ({ suggestion, onAccept, onReject, currentUser }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getHighlightColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-200 border-green-400';
      case 'rejected':
        return 'bg-red-200 border-red-400';
      default:
        return 'bg-blue-200 border-blue-400';
    }
  };

  return (
    <div className="relative inline-block group">
      {/* Highlighted text */}
      <span className={`${getHighlightColor(suggestion.status)} px-1 py-0.5 rounded border-2 border-dashed transition-all duration-200`}>
        {suggestion.selectedText}
      </span>
      
      {/* Suggestion tooltip */}
      <div className="absolute z-50 w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 top-full left-0 mt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{suggestion.author}</span>
            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(suggestion.status)}`}>
              Suggestion - {suggestion.status}
            </span>
          </div>
          <span className="text-sm text-gray-500">{formatDate(suggestion.createdAt)}</span>
        </div>
        
        {/* Original text */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">Original:</p>
          <div className="bg-red-50 border-l-4 border-red-500 p-2 rounded">
            <p className="text-sm text-gray-800 line-through">"{suggestion.selectedText}"</p>
          </div>
        </div>
        
        {/* Suggested text */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">Suggested:</p>
          <div className="bg-green-50 border-l-4 border-green-500 p-2 rounded">
            <p className="text-sm text-gray-800 font-medium">"{suggestion.suggestedText}"</p>
          </div>
        </div>
        
        {/* Explanation */}
        {suggestion.text && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-1">Explanation:</p>
            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{suggestion.text}</p>
          </div>
        )}
        
        {/* Action buttons */}
        {suggestion.status === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={() => onAccept(suggestion.id)}
              className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
            >
              Accept Suggestion
            </button>
            <button
              onClick={() => onReject(suggestion.id)}
              className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
            >
              Reject
            </button>
          </div>
        )}
        
        {/* Status message for resolved suggestions */}
        {suggestion.status !== 'pending' && (
          <div className={`p-2 rounded text-sm ${getStatusColor(suggestion.status)}`}>
            {suggestion.status === 'accepted' 
              ? '✓ This suggestion has been accepted' 
              : '✗ This suggestion has been rejected'}
            {suggestion.resolvedBy && (
              <span className="text-xs ml-2">
                by {suggestion.resolvedByName || 'someone'} on {formatDate(suggestion.resolvedAt)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestionHighlight;