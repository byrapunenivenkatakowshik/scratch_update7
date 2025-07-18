import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService, commentService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Editor from '../components/Editor';
import BlockEditor from '../components/BlockEditor';
import ShareModal from '../components/ShareModal';
import CommentPanel from '../components/CommentPanel';
import InlineComment from '../components/InlineComment';
import SuggestionHighlight from '../components/SuggestionHighlight';
import useSocket from '../hooks/useSocket';
import useWebRTC from '../hooks/useWebRTC';
import '../styles/Editor.css';

const EditorPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showWordCount, setShowWordCount] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [webrtcEnabled, setWebrtcEnabled] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [showCommentSidebar, setShowCommentSidebar] = useState(true);
  const [selectedTextForComment, setSelectedTextForComment] = useState('');
  const [selectedRange, setSelectedRange] = useState(null);
  const [commentType, setCommentType] = useState('comment');
  const [selectionType, setSelectionType] = useState('text');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const titleRef = useRef(null);
  const contentUpdateRef = useRef(false);
  const titleUpdateRef = useRef(false);
  
  const {
    connect,
    disconnect,
    joinDocument,
    sendContentChange,
    sendTitleChange,
    sendCursorPosition,
    sendMousePosition,
    onContentUpdated,
    socket,
    onTitleUpdated,
    onCursorUpdated,
    onMouseUpdated,
    onUserJoined,
    onUserLeft,
    onActiveUsers,
    onActiveUsersUpdated,
    onError
  } = useSocket();

  const handleCursorUpdate = useCallback((peerId, cursorData) => {
    setActiveUsers(prevUsers => {
      const updatedUsers = prevUsers.map(user => {
        if (user.userId === cursorData.userId) {
          return { ...user, cursorPosition: cursorData.position };
        }
        return user;
      });
      
      // If user not found, add them
      if (!updatedUsers.find(user => user.userId === cursorData.userId)) {
        updatedUsers.push({
          userId: cursorData.userId,
          userName: cursorData.userName,
          cursorPosition: cursorData.position
        });
      }
      
      return updatedUsers;
    });
  }, []);

  const {
    isConnected: webrtcConnected,
    connectionState,
    peers,
    sendContentUpdate,
    sendCursorUpdate,
    sendTypingIndicator
  } = useWebRTC(id, user?.userId, handleCursorUpdate);

  useEffect(() => {
    console.log('EditorPage mounted with id:', id);
    console.log('User:', user);
    
    if (id) {
      fetchDocument();
      initializeSocket();
    }
    // Animation trigger
    setTimeout(() => setIsVisible(true), 100);
    
    return () => {
      disconnect();
    };
  }, [id]);

  const initializeSocket = () => {
    connect();
    setIsConnected(true);

    // Set up socket event listeners
    onContentUpdated((data) => {
      if (!contentUpdateRef.current) {
        setContent(data.content);
      }
    });

    onTitleUpdated((data) => {
      if (!titleUpdateRef.current) {
        setTitle(data.title);
      }
    });

    onCursorUpdated((data) => {
      setActiveUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          if (user.userId === data.userId) {
            return { ...user, cursorPosition: data.position };
          }
          return user;
        });
        
        if (!updatedUsers.find(user => user.userId === data.userId)) {
          updatedUsers.push({
            userId: data.userId,
            userName: data.userName,
            cursorPosition: data.position
          });
        }
        
        return updatedUsers;
      });
    });

    onMouseUpdated((data) => {
      setActiveUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          if (user.userId === data.userId) {
            return { ...user, mousePosition: data.position };
          }
          return user;
        });
        
        if (!updatedUsers.find(user => user.userId === data.userId)) {
          updatedUsers.push({
            userId: data.userId,
            userName: data.userName,
            mousePosition: data.position
          });
        }
        
        return updatedUsers;
      });
    });

    onUserJoined((data) => {
      console.log('User joined:', data.userName);
    });

    onUserLeft((data) => {
      console.log('User left:', data.userName);
    });

    onActiveUsers((users) => {
      setActiveUsers(users);
    });

    onActiveUsersUpdated((users) => {
      setActiveUsers(users);
    });

    onError((error) => {
      console.error('Socket error:', error);
    });
  };

  useEffect(() => {
    const updateCounts = () => {
      const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      const chars = content.length;
      setWordCount(words);
      setCharacterCount(chars);
    };
    
    updateCounts();
  }, [content]);

  const fetchDocument = async () => {
    console.log('Fetching document with id:', id);
    try {
      const { document } = await documentService.getDocument(id);
      console.log('Document fetched successfully:', document);
      setDocument(document);
      setTitle(document.title);
      setContent(document.content);
      
      // Join the document room for real-time collaboration
      if (user) {
        setTimeout(() => {
          joinDocument(id, user.userId, user.name);
        }, 1000);
      }
      
      // Load comments
      loadComments();
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err.response?.data?.error || 'Failed to fetch document');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      console.log('Loading comments for document:', id);
      const { comments } = await commentService.getComments(id);
      console.log('Loaded comments:', comments);
      setComments(comments || []);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const saveDocument = async () => {
    if (!document) return;

    setSaving(true);
    try {
      await documentService.updateDocument(document.id, title, content);
      setLastSaved(new Date());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const getLastSavedText = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastSaved) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Saved just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return `Saved at ${lastSaved.toLocaleTimeString()}`;
    }
  };



  const toggleCommentSidebar = () => {
    setShowCommentSidebar(!showCommentSidebar);
  };

  const expandComment = (commentId) => {
    setExpandedComment(expandedComment === commentId ? null : commentId);
  };

  const handleTitleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Focus on editor content with smooth transition
      const editorElement = document.querySelector('.tiptap-editor');
      if (editorElement) {
        editorElement.focus();
        // Scroll to editor if needed
        editorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const getReadingTime = () => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  };

  const handleTitleChange = (newTitle) => {
    titleUpdateRef.current = true;
    setTitle(newTitle);
    
    // Send real-time title update
    if (isConnected && user) {
      sendTitleChange(id, newTitle, user.userId);
    }
    
    setTimeout(() => {
      titleUpdateRef.current = false;
    }, 100);
  };

  const handleTitleFocus = () => {
    const indicator = document.getElementById('title-focus-indicator');
    if (indicator) {
      indicator.style.opacity = '1';
      indicator.style.transform = 'scaleX(1)';
    }
  };

  const handleTitleBlur = () => {
    const indicator = document.getElementById('title-focus-indicator');
    if (indicator) {
      indicator.style.opacity = '0';
      indicator.style.transform = 'scaleX(0)';
    }
  };

  const handleContentChange = (newContent) => {
    contentUpdateRef.current = true;
    setContent(newContent);
    
    // Send real-time content update
    if (isConnected && user) {
      sendContentChange(id, newContent, user.userId);
    }
    
    setTimeout(() => {
      contentUpdateRef.current = false;
    }, 100);
  };

  // Simple throttle function
  const throttle = (func, delay) => {
    let timeoutId;
    let lastExecTime = 0;
    
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  };

  const handleCursorMove = useRef(null);
  const handleMouseMove = useRef(null);
  
  // Create throttled cursor move handler
  useEffect(() => {
    const throttledCursorMove = throttle((position) => {
      if (user?.userId && isConnected) {
        const cursorData = {
          userId: user.userId,
          userName: user.name,
          position: position,
          timestamp: Date.now()
        };
        
        // Send cursor update via Socket.IO
        sendCursorPosition(id, position, user.userId);
        
        // Send cursor update via WebRTC as backup
        sendCursorUpdate(cursorData);
      }
    }, 100); // Throttle to 100ms
    
    handleCursorMove.current = throttledCursorMove;
  }, [user?.userId, isConnected, sendCursorPosition, sendCursorUpdate, id]);

  // Create throttled mouse move handler
  useEffect(() => {
    const throttledMouseMove = throttle((position) => {
      if (user?.userId && isConnected) {
        // Send mouse position update via Socket.IO
        sendMousePosition(id, position, user.userId);
      }
    }, 50); // Throttle to 50ms for smoother mouse tracking
    
    handleMouseMove.current = throttledMouseMove;
  }, [user?.userId, isConnected, sendMousePosition, id]);


  const handleSave = () => {
    saveDocument();
  };

  const handleCommentAdd = async (commentData) => {
    console.log('Adding comment to state:', commentData);
    
    // If commentData is from inline comment (has text, selectedText, range)
    if (commentData.text && commentData.selectedText && commentData.range) {
      try {
        const response = await commentService.addComment(
          id,
          commentData.text,
          commentData.selectedText,
          commentData.range,
          null,
          commentData.type || 'comment',
          commentData.suggestedText || null
        );
        
        if (response.comment) {
          setComments(prev => {
            const updated = [response.comment, ...prev];
            console.log('Updated comments state:', updated);
            return updated;
          });
          
          // Emit socket event for real-time sync
          if (socket && socket.connected) {
            socket.emit('suggestion-added', {
              documentId: id,
              suggestion: response.comment
            });
          }
        }
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    } else {
      // Handle regular comment object
      setComments(prev => {
        const updated = [commentData, ...prev];
        console.log('Updated comments state:', updated);
        return updated;
      });
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Handle text selection for suggestions
  const handleTextSelect = (selectedText, range, type = 'suggestion', selectionType = 'text', suggestionText = '') => {
    setSelectedTextForComment(selectedText);
    setSelectedRange(range);
    setCommentType(type);
    setSelectionType(selectionType);
    
    // If suggestionText is provided (from # suggestion), create suggestion immediately
    if (suggestionText && suggestionText.trim()) {
      handleCommentAdd({
        text: suggestionText,
        selectedText,
        range,
        type,
        selectionType
      });
    }
  };

  // Handle comment actions
  const handleCommentResolve = (commentId) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, isResolved: true, resolvedBy: user.userId, resolvedAt: new Date().toISOString() }
          : comment
      )
    );
  };

  const handleSuggestionResolve = (suggestionId, action) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === suggestionId 
          ? { 
              ...comment, 
              status: action, 
              isResolved: true, 
              resolvedBy: user.userId, 
              resolvedAt: new Date().toISOString() 
            }
          : comment
      )
    );
  };

  const handleReplyAdd = (reply) => {
    setComments(prev => [...prev, reply]);
  };

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (document && (title !== document.title || content !== document.content)) {
        saveDocument();
      }
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [title, content, document]);

  // Socket event handlers for comments
  useEffect(() => {
    if (socket) {
      socket.on('comment-added', (data) => {
        setComments(prev => [...prev, data.comment]);
      });

      socket.on('suggestion-added', (data) => {
        setComments(prev => [...prev, data.suggestion]);
      });

      socket.on('comment-resolved', (data) => {
        setComments(prev => 
          prev.map(comment => 
            comment.id === data.commentId 
              ? { ...comment, isResolved: true, resolvedBy: data.resolvedBy, resolvedAt: data.timestamp }
              : comment
          )
        );
      });

      socket.on('suggestion-resolved', (data) => {
        setComments(prev => 
          prev.map(comment => 
            comment.id === data.suggestionId 
              ? { 
                  ...comment, 
                  status: data.action, 
                  isResolved: true, 
                  resolvedBy: data.resolvedBy, 
                  resolvedAt: data.timestamp 
                }
              : comment
          )
        );
      });

      socket.on('reply-added', (data) => {
        setComments(prev => [...prev, data.reply]);
      });

      return () => {
        socket.off('comment-added');
        socket.off('suggestion-added');
        socket.off('comment-resolved');
        socket.off('suggestion-resolved');
        socket.off('reply-added');
      };
    }
  }, [socket]);

  if (loading) {
    return (
      <div className="editor-loading">
        <div className="editor-loading-spinner">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="editor-loading-text">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`editor-container ${isVisible ? 'editor-visible' : ''}`} style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <nav className="editor-nav" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e9e9e7', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <div className="editor-nav-content">
          <div className="editor-nav-inner">
            <div className="editor-nav-left">
              <button
                onClick={() => navigate('/dashboard')}
                className="editor-nav-back"
                style={{ color: '#37352f', fontSize: '14px', fontWeight: '500' }}
              >
                ← Back to Dashboard
              </button>
              <div className="editor-nav-actions">
                <div className="editor-nav-status">
                  {saving ? (
                    <span className="editor-nav-saving" style={{ color: '#37352f', fontSize: '14px' }}>
                      <span className="editor-saving-spinner"></span>
                      Saving...
                    </span>
                  ) : (
                    <span className="editor-nav-saved" style={{ color: '#9b9a97', fontSize: '14px' }}>
                      {getLastSavedText()}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleSave}
                  className="editor-nav-save"
                  disabled={saving}
                  style={{ 
                    backgroundColor: '#2383e2', 
                    color: '#ffffff', 
                    padding: '6px 12px', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowWordCount(!showWordCount)}
                  className="editor-nav-stats"
                  title="Toggle word count"
                  style={{ 
                    backgroundColor: 'transparent', 
                    color: '#37352f', 
                    padding: '6px 12px',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  📊
                </button>
                <button
                  onClick={toggleCommentSidebar}
                  className="editor-nav-comments"
                  title="Toggle suggestions"
                  style={{ 
                    backgroundColor: showCommentSidebar ? '#8B5CF6' : 'transparent', 
                    color: showCommentSidebar ? '#ffffff' : '#37352f', 
                    padding: '6px 12px', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #e9e9e7',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  💡 Suggestions
                  {comments.length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {comments.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="editor-nav-right">
              <span className="editor-nav-welcome" style={{ color: '#37352f', fontSize: '14px' }}>Welcome, {user?.name}</span>
              <button 
                onClick={() => navigate('/profile')} 
                className="editor-nav-profile"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: '#37352f', 
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Profile
              </button>
              <button 
                onClick={logout} 
                className="editor-nav-logout"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: '#37352f', 
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="editor-content">
        {/* Word Count Panel */}
        {showWordCount && (
          <div 
            className="editor-stats-panel" 
            style={{ 
              position: 'fixed', 
              bottom: '20px', 
              right: '20px', 
              backgroundColor: '#ffffff', 
              border: '1px solid #e9e9e7', 
              borderRadius: '8px', 
              padding: '16px', 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
              fontSize: '14px',
              color: '#37352f'
            }}
          >
            <div className="editor-stats-content" style={{ display: 'flex', gap: '20px' }}>
              <div className="editor-stat-item" style={{ textAlign: 'center' }}>
                <span className="editor-stat-label" style={{ display: 'block', color: '#9b9a97', fontSize: '12px', marginBottom: '4px' }}>Words</span>
                <span className="editor-stat-value" style={{ display: 'block', fontWeight: '600', fontSize: '18px', color: '#37352f' }}>{wordCount}</span>
              </div>
              <div className="editor-stat-item" style={{ textAlign: 'center' }}>
                <span className="editor-stat-label" style={{ display: 'block', color: '#9b9a97', fontSize: '12px', marginBottom: '4px' }}>Characters</span>
                <span className="editor-stat-value" style={{ display: 'block', fontWeight: '600', fontSize: '18px', color: '#37352f' }}>{characterCount}</span>
              </div>
              <div className="editor-stat-item" style={{ textAlign: 'center' }}>
                <span className="editor-stat-label" style={{ display: 'block', color: '#9b9a97', fontSize: '12px', marginBottom: '4px' }}>Reading Time</span>
                <span className="editor-stat-value" style={{ display: 'block', fontWeight: '600', fontSize: '18px', color: '#37352f' }}>{getReadingTime()} min</span>
              </div>
            </div>
          </div>
        )}

        <div className="editor-document-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 96px 200px' }}>
          <div className="editor-title-section relative">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onKeyPress={handleTitleKeyPress}
              onFocus={handleTitleFocus}
              onBlur={handleTitleBlur}
              className="w-full text-5xl font-bold bg-transparent border-none outline-none resize-none placeholder-gray-400 transition-all duration-200"
              style={{
                color: '#37352f',
                fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif',
                fontSize: '48px',
                lineHeight: '1.2',
                fontWeight: '700',
                margin: '0 0 20px 0',
                padding: '3px 2px',
                caretColor: '#37352f'
              }}
              placeholder="Untitled"
            />
            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 scale-x-0 origin-left transition-all duration-300 transform" id="title-focus-indicator"></div>
          </div>

          <div className="editor-content-section" style={{ marginTop: '0' }}>
            <Editor
              content={content}
              onUpdate={handleContentChange}
              onCursorMove={handleCursorMove.current}
              onMouseMove={handleMouseMove.current}
              onTextSelect={handleTextSelect}
              editable={true}
              activeUsers={activeUsers}
              currentUserId={user?.userId}
              comments={comments}
            />
          </div>
        </div>
      </div>

      {/* Comment Panel */}
      {showCommentSidebar && (
        <div className="fixed right-0 top-0 h-full z-40">
          <CommentPanel
            documentId={id}
            comments={comments}
            onCommentAdd={handleCommentAdd}
            onCommentResolve={handleCommentResolve}
            onSuggestionResolve={handleSuggestionResolve}
            onReplyAdd={handleReplyAdd}
            currentUser={user}
            selectedText={selectedTextForComment}
            selectedRange={selectedRange}
            commentType={commentType}
            selectionType={selectionType}
          />
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentId={id}
        documentTitle={title}
        currentUser={user}
      />
    </div>
  );
};

export default EditorPage;