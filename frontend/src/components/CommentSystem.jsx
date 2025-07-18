import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CommentSystem = ({ documentId, documentTitle, onCommentAdd, onCommentDelete, comments = [], isVisible = true, isPublicDocument = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState(null);
  const [commentType, setCommentType] = useState('comment'); // 'comment' or 'suggestion'
  const [suggestedText, setSuggestedText] = useState('');
  const { user } = useAuth();
  const commentBoxRef = useRef(null);
  
  // Comments are already filtered by document when fetched from API
  const documentComments = comments;
  
  console.log('CommentSystem received comments:', comments);
  console.log('DocumentId:', documentId);
  console.log('Document comments to display:', documentComments);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const text = selection.toString();
        
        if (text.trim() && rect.width > 0) {
          setSelectedText(text);
          setSelectedRange({
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset,
            text: text
          });
          
          // Calculate position relative to viewport
          const viewportWidth = window.innerWidth;
          const boxWidth = 320; // Comment box width
          let xPosition = rect.right + 10;
          
          // If comment box would go off-screen, position it to the left
          if (xPosition + boxWidth > viewportWidth) {
            xPosition = rect.left - boxWidth - 10;
          }
          
          setPosition({
            x: Math.max(10, xPosition), // Ensure minimum margin from left edge
            y: rect.top + window.scrollY
          });
          setIsOpen(true);
        }
      }
    };

    const handleClickOutside = (event) => {
      if (commentBoxRef.current && !commentBoxRef.current.contains(event.target)) {
        setIsOpen(false);
        setNewComment('');
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddComment = () => {
    if (newComment.trim() && selectedRange && user) {
      const comment = {
        id: Date.now().toString(),
        text: newComment,
        selectedText: selectedText,
        author: user.name,
        authorId: user.userId,
        timestamp: new Date().toISOString(),
        position: position,
        range: selectedRange,
        documentId: documentId, // Ensure document specificity
        type: commentType,
        suggestedText: commentType === 'suggestion' ? suggestedText : null
      };

      onCommentAdd(comment);
      setNewComment('');
      setSuggestedText('');
      setIsOpen(false);
      setSelectedText('');
      setSelectedRange(null);
      setCommentType('comment');
    }
  };

  const handleDeleteComment = (commentId) => {
    onCommentDelete(commentId);
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

  return (
    <>
      {/* Comment Input Box */}
      {isOpen && (
        <div
          ref={commentBoxRef}
          className="comment-input-box"
          style={{
            position: 'absolute',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 1000,
            backgroundColor: '#ffffff',
            border: '1px solid #e9e9e7',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            width: '320px',
            fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#37352f', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              💬 Add comment to:
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: '#6b7280', 
              backgroundColor: '#f8fafc', 
              padding: '10px 12px', 
              borderRadius: '6px',
              fontStyle: 'italic',
              maxHeight: '80px',
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderLeft: '3px solid #3b82f6',
              lineHeight: '1.4'
            }}>
              "{selectedText}"
            </div>
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your comment..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '8px',
              border: '1px solid #e9e9e7',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              marginBottom: '12px'
            }}
            autoFocus
          />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                padding: '6px 12px',
                backgroundColor: 'transparent',
                border: '1px solid #e9e9e7',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                color: '#37352f'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              style={{
                padding: '6px 12px',
                backgroundColor: '#2383e2',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#ffffff',
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                opacity: newComment.trim() ? 1 : 0.5
              }}
            >
              Comment
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {isVisible && (
        <div className="comments-list" style={{ 
          position: 'fixed', 
          right: '20px', 
          top: '80px', 
          width: '320px',
          maxHeight: '70vh',
          overflowY: 'auto',
          zIndex: 999
        }}>
        {documentComments.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e9e9e7',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
          }}>
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '2px solid #f1f1ef'
            }}>
              {/* Document Title */}
              {documentTitle && (
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#37352f',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  📄 {documentTitle}
                </div>
              )}
              
              {/* Comments Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#37352f', 
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  💬 Comments
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#9b9a97',
                    backgroundColor: '#f1f1ef',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {documentComments.length}
                  </span>
                </h3>
                <div style={{
                  fontSize: '11px',
                  color: '#9b9a97',
                  fontStyle: 'italic'
                }}>
                  Select text to comment
                </div>
              </div>
            </div>
            
            {documentComments.map((comment) => (
              <div key={comment.id} style={{ 
                marginBottom: '16px', 
                paddingBottom: '16px',
                borderBottom: documentComments.indexOf(comment) !== documentComments.length - 1 ? '1px solid #f1f1ef' : 'none',
                backgroundColor: '#fafafa',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #f1f1ef'
              }}>
                {/* Author and timestamp header */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '10px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#2383e2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#ffffff'
                    }}>
                      {comment.author?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#37352f' }}>
                        {comment.author || 'Unknown User'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9b9a97' }}>
                        {formatTime(comment.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  {user && user.userId === comment.authorId && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: '1px solid #e9e9e7',
                        color: '#eb5757',
                        fontSize: '11px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#ffebee';
                        e.target.style.borderColor = '#eb5757';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.borderColor = '#e9e9e7';
                      }}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
                
                {/* Quoted text section */}
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  backgroundColor: '#f8fafc', 
                  padding: '8px 12px', 
                  borderRadius: '6px',
                  fontStyle: 'italic',
                  marginBottom: '10px',
                  borderLeft: '3px solid #e5e7eb',
                  position: 'relative'
                }}>
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#9ca3af', 
                    fontWeight: '500', 
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    💬 Commented on:
                  </div>
                  <div style={{ lineHeight: '1.4' }}>
                    "{comment.selectedText}"
                  </div>
                </div>
                
                {/* Comment text */}
                <div style={{ 
                  fontSize: '14px', 
                  color: '#37352f', 
                  lineHeight: '1.5',
                  padding: '8px 0',
                  wordWrap: 'break-word'
                }}>
                  {comment.text}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}
    </>
  );
};

export default CommentSystem;