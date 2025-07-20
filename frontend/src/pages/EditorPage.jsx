import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Editor from '../components/Editor';
import ShareModal from '../components/ShareModal';
import CommentSidebar from '../components/CommentSidebar';
import SuggestionSidebar from '../components/SuggestionSidebar';
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
  const [showComments, setShowComments] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
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
    onError,
    // Suggestion functions (with fallbacks)
    sendSuggestionAdded = () => {},
    sendSuggestionResolved = () => {},
    onSuggestionAdded = () => {},
    onSuggestionResolved = () => {}
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
      console.log('Mouse position updated received:', data);
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
        
        console.log('Updated activeUsers with mouse position:', updatedUsers);
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

  // Socket listeners for suggestions (using useSocket hooks)
  useEffect(() => {
    if (!socket || !onSuggestionAdded || !onSuggestionResolved) return;

    const handleSuggestionAdded = (data) => {
      console.log('=== SUGGESTION RECEIVED ===');
      console.log('Data:', data);
      
      if (data.suggestion && data.suggestion.documentId === id) {
        console.log('Adding suggestion to list');
        setSuggestions(prev => {
          // Check if suggestion already exists to prevent duplicates
          const exists = prev.find(s => s.id === data.suggestion.id);
          if (exists) {
            console.log('Suggestion already exists, skipping');
            return prev;
          }
          return [data.suggestion, ...prev];
        });
        
        // Auto-open suggestions sidebar for document owner
        if (user?.userId === document?.createdBy && !showSuggestions) {
          console.log('Auto-opening suggestions sidebar for document owner');
          setShowSuggestions(true);
        }
      }
    };

    const handleSuggestionResolved = (data) => {
      console.log('Suggestion resolved:', data);
      if (data.documentId === id) {
        setSuggestions(prev => prev.map(suggestion => 
          suggestion.id === data.suggestionId 
            ? { ...suggestion, status: data.action === 'accepted' ? 'approved' : 'rejected' }
            : suggestion
        ));
      }
    };

    onSuggestionAdded(handleSuggestionAdded);
    onSuggestionResolved(handleSuggestionResolved);

    // Cleanup function to remove listeners
    return () => {
      // Note: We can't remove individual listeners with the current useSocket implementation
      // This is handled by the useSocket hook itself
    };
  }, [socket, id, user?.userId, document?.createdBy, showSuggestions]);


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
      
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err.response?.data?.error || 'Failed to fetch document');
    } finally {
      setLoading(false);
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
      console.log('EditorPage mouse move:', { position, userId: user?.userId, isConnected, hasHandler: !!sendMousePosition });
      if (user?.userId && isConnected && socket?.connected) {
        // Send mouse position update via Socket.IO
        sendMousePosition(id, position, user.userId);
        console.log('Mouse position sent:', { id, position, userId: user.userId, socketConnected: socket?.connected });
      }
    }, 16); // Throttle to 16ms for ~60fps smoother mouse tracking
    
    handleMouseMove.current = throttledMouseMove;
  }, [user?.userId, isConnected, sendMousePosition, id, socket?.connected]);


  const handleSave = () => {
    saveDocument();
  };

  // Handle suggestions
  const handleSuggestionsChange = (newSuggestions) => {
    setSuggestions(newSuggestions);
    if (newSuggestions.length > 0 && !showSuggestions) {
      setShowSuggestions(true);
    }
  };


  const handleAcceptSuggestion = (suggestionId) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;
    
    // Apply the suggestion to the content
    const newContent = content.replace(suggestion.originalText, suggestion.suggestionText);
    setContent(newContent);
    
    // Update suggestion status
    setSuggestions(prev => 
      prev.map(s => s.id === suggestionId ? { ...s, status: 'approved' } : s)
    );
    
    // Remove approved suggestion after 3 seconds
    setTimeout(() => {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    }, 3000);
    
    // Emit socket event (like comments)
    if (socket && id) {
      const updatedSuggestion = { ...suggestion, status: 'approved' };
      socket.emit('suggestion-updated', {
        suggestion: updatedSuggestion
      });
    }
  };

  const handleRejectSuggestion = (suggestionId) => {
    // Update suggestion status
    setSuggestions(prev => 
      prev.map(s => s.id === suggestionId ? { ...s, status: 'rejected' } : s)
    );
    
    // Remove rejected suggestion after 2 seconds
    setTimeout(() => {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    }, 2000);
    
    // Emit socket event (like comments)
    if (socket && id) {
      const suggestion = suggestions.find(s => s.id === suggestionId);
      const updatedSuggestion = { ...suggestion, status: 'rejected' };
      socket.emit('suggestion-updated', {
        suggestion: updatedSuggestion
      });
    }
  };


  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (document && (title !== document.title || content !== document.content)) {
        saveDocument();
      }
    }, 2000);

    return () => clearTimeout(saveTimer);
  }, [title, content, document]);


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
                  onClick={() => setShowComments(!showComments)}
                  className="editor-nav-comments"
                  title="Toggle comments"
                  style={{ 
                    backgroundColor: showComments ? '#f3f2f1' : 'transparent', 
                    color: '#37352f', 
                    padding: '6px 12px',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  💬
                </button>
                <button
                  onClick={() => {
                    console.log('Suggestions button clicked');
                    console.log('Current suggestions:', suggestions);
                    console.log('User is owner:', user?.userId === document?.createdBy);
                    setShowSuggestions(!showSuggestions);
                  }}
                  className="editor-nav-suggestions"
                  title="Toggle suggestions"
                  style={{ 
                    backgroundColor: showSuggestions ? '#f3f2f1' : 'transparent', 
                    color: '#37352f', 
                    padding: '6px 12px',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  💡 Suggestions ({suggestions.length})
                  {suggestions.filter(s => s.status === 'pending').length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                      {suggestions.filter(s => s.status === 'pending').length}
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
              editable={true}
              activeUsers={activeUsers}
              currentUserId={user?.userId}
              documentOwnerId={document?.createdBy}
              onSuggestionsChange={handleSuggestionsChange}
              suggestions={suggestions}
              onAcceptSuggestion={handleAcceptSuggestion}
              onRejectSuggestion={handleRejectSuggestion}
              socket={socket}
              documentId={id}
            />
          </div>
        </div>
      </div>


      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        documentId={id}
        documentTitle={title}
        currentUser={user}
      />

      {/* Comment Sidebar */}
      <CommentSidebar
        documentId={id}
        isVisible={showComments}
        onClose={() => setShowComments(false)}
        socket={socket}
      />

      {/* Suggestion Sidebar */}
      <SuggestionSidebar
        suggestions={suggestions}
        currentUserId={user?.userId}
        documentOwnerId={document?.createdBy}
        onAcceptSuggestion={handleAcceptSuggestion}
        onRejectSuggestion={handleRejectSuggestion}
        isVisible={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        socket={socket}
        documentId={id}
      />

    </div>
  );
};

export default EditorPage;