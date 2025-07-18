import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { commentService, documentService } from '../services/api';

const AllCommentsSidebar = ({ isOpen, onClose }) => {
  const [allComments, setAllComments] = useState([]);
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('document'); // 'document' or 'recent'
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchAllComments();
    }
  }, [isOpen]);

  const fetchAllComments = async () => {
    try {
      setLoading(true);
      
      // Get all documents first
      const { documents: userDocs } = await documentService.getDocuments();
      const docsMap = {};
      userDocs.forEach(doc => {
        docsMap[doc.id] = doc;
      });
      setDocuments(docsMap);
      
      // Get comments for all documents
      const allCommentsPromises = userDocs.map(doc => 
        commentService.getComments(doc.id).then(response => ({
          documentId: doc.id,
          comments: response.comments || []
        }))
      );
      
      const commentsByDoc = await Promise.all(allCommentsPromises);
      
      // Flatten all comments with document info
      const flatComments = commentsByDoc.flatMap(({ documentId, comments }) => 
        comments.map(comment => ({
          ...comment,
          documentId,
          documentTitle: docsMap[documentId]?.title || 'Unknown Document'
        }))
      );
      
      setAllComments(flatComments);
    } catch (error) {
      console.error('Error fetching all comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const groupComments = () => {
    if (groupBy === 'document') {
      const grouped = {};
      allComments.forEach(comment => {
        if (!grouped[comment.documentId]) {
          grouped[comment.documentId] = {
            documentTitle: comment.documentTitle,
            comments: []
          };
        }
        grouped[comment.documentId].comments.push(comment);
      });
      
      // Sort comments within each document by timestamp
      Object.keys(grouped).forEach(docId => {
        grouped[docId].comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
      
      return grouped;
    } else {
      // Recent - just return all comments sorted by time
      return allComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  };

  const handleCommentClick = (comment) => {
    navigate(`/editor/${comment.documentId}`);
    onClose();
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setAllComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (!isOpen) return null;

  const groupedComments = groupComments();

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      right: '0',
      width: '400px',
      height: '100vh',
      backgroundColor: '#ffffff',
      boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #f1f1ef',
        backgroundColor: '#fafafa'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h2 style={{
            margin: '0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#37352f'
          }}>
            All Comments
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#9b9a97',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Group by toggle */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setGroupBy('document')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              backgroundColor: groupBy === 'document' ? '#3b82f6' : 'transparent',
              color: groupBy === 'document' ? 'white' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            📁 By Document
          </button>
          <button
            onClick={() => setGroupBy('recent')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              backgroundColor: groupBy === 'recent' ? '#3b82f6' : 'transparent',
              color: groupBy === 'recent' ? 'white' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            🕒 Recent
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: '#9b9a97'
          }}>
            Loading comments...
          </div>
        ) : allComments.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: '#9b9a97',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No comments yet</div>
            <div style={{ fontSize: '14px' }}>Select text in any document to add comments</div>
          </div>
        ) : (
          <div>
            {groupBy === 'document' ? (
              // Group by document view
              Object.entries(groupedComments).map(([docId, { documentTitle, comments }]) => (
                <div key={docId} style={{ marginBottom: '24px' }}>
                  {/* Document header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#37352f',
                      flex: 1
                    }}>
                      📄 {documentTitle}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#9b9a97',
                      backgroundColor: '#e5e7eb',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {comments.length} comment{comments.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Comments for this document */}
                  {comments.map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onClick={() => handleCommentClick(comment)}
                      onDelete={() => handleDeleteComment(comment.id)}
                      user={user}
                      formatTime={formatTime}
                      showDocumentTitle={false}
                    />
                  ))}
                </div>
              ))
            ) : (
              // Recent view
              groupedComments.map(comment => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onClick={() => handleCommentClick(comment)}
                  onDelete={() => handleDeleteComment(comment.id)}
                  user={user}
                  formatTime={formatTime}
                  showDocumentTitle={true}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Comment item component
const CommentItem = ({ comment, onClick, onDelete, user, formatTime, showDocumentTitle }) => {
  return (
    <div
      style={{
        marginBottom: '12px',
        padding: '12px',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '1px solid #f1f1ef',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={onClick}
      onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f4'}
      onMouseLeave={(e) => e.target.style.backgroundColor = '#fafafa'}
    >
      {/* Comment header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: comment.type === 'suggestion' ? '#10b981' : '#2383e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: '600',
            color: '#ffffff'
          }}>
            {comment.type === 'suggestion' ? '✏️' : comment.author?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#37352f' }}>
              {comment.author || 'Unknown User'}
            </div>
            <div style={{ fontSize: '10px', color: '#9b9a97' }}>
              {formatTime(comment.timestamp)}
            </div>
          </div>
        </div>
        
        {user && user.userId === comment.authorId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#eb5757',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            🗑️
          </button>
        )}
      </div>

      {/* Document title (for recent view) */}
      {showDocumentTitle && (
        <div style={{
          fontSize: '11px',
          color: '#6b7280',
          marginBottom: '8px',
          fontWeight: '500'
        }}>
          📄 {comment.documentTitle}
        </div>
      )}

      {/* Selected text */}
      <div style={{
        fontSize: '11px',
        color: '#6b7280',
        backgroundColor: comment.type === 'suggestion' ? '#f0fdf4' : '#f8fafc',
        padding: '6px 8px',
        borderRadius: '4px',
        fontStyle: 'italic',
        marginBottom: '8px',
        borderLeft: `2px solid ${comment.type === 'suggestion' ? '#10b981' : '#3b82f6'}`
      }}>
        "{comment.selectedText}"
      </div>

      {/* Suggested text for suggestions */}
      {comment.type === 'suggestion' && comment.suggestedText && (
        <div style={{
          fontSize: '11px',
          color: '#059669',
          backgroundColor: '#dcfce7',
          padding: '6px 8px',
          borderRadius: '4px',
          marginBottom: '8px',
          border: '1px solid #10b981'
        }}>
          <strong>Suggested:</strong> "{comment.suggestedText}"
        </div>
      )}

      {/* Comment text */}
      <div style={{
        fontSize: '13px',
        color: '#37352f',
        lineHeight: '1.4'
      }}>
        {comment.text}
      </div>
    </div>
  );
};

export default AllCommentsSidebar;