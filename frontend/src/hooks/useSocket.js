import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import config from '../config/config';

const useSocket = () => {
  const socketRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize socket connection with auth token
    const token = localStorage.getItem('token');
    socketRef.current = io(config.wsUrl, {
      transports: ['websocket'],
      autoConnect: false,
      auth: {
        token: token
      }
    });

    // Add connection event listeners
    socketRef.current.on('connect', () => {
      // Socket connected successfully
    });

    socketRef.current.on('disconnect', () => {
      // Socket disconnected
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      // Try to reconnect after a delay
      setTimeout(() => {
        if (socketRef.current && !socketRef.current.connected) {
          socketRef.current.connect();
        }
      }, 3000);
    });

    setIsInitialized(true);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  };

  const disconnect = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  };

  const joinDocument = (documentId, userId, userName) => {
    if (socketRef.current) {
      socketRef.current.emit('join-document', { documentId, userId, userName });
    }
  };

  const leaveDocument = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const sendContentChange = (documentId, content, userId) => {
    if (socketRef.current) {
      socketRef.current.emit('content-change', { documentId, content, userId });
    }
  };

  const sendTitleChange = (documentId, title, userId) => {
    if (socketRef.current) {
      socketRef.current.emit('title-change', { documentId, title, userId });
    }
  };

  const sendCursorPosition = (documentId, position, userId) => {
    if (socketRef.current) {
      socketRef.current.emit('cursor-position', { documentId, position, userId });
    }
  };

  const sendMousePosition = (documentId, position, userId) => {
    if (socketRef.current) {
      socketRef.current.emit('mouse-position', { documentId, position, userId });
    }
  };

  const onContentUpdated = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('content-updated');
      socketRef.current.on('content-updated', callback);
    }
  };

  const onTitleUpdated = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('title-updated');
      socketRef.current.on('title-updated', callback);
    }
  };

  const onCursorUpdated = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('cursor-updated');
      socketRef.current.on('cursor-updated', callback);
    }
  };

  const onMouseUpdated = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('mouse-updated');
      socketRef.current.on('mouse-updated', callback);
    }
  };

  const onUserJoined = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('user-joined');
      socketRef.current.on('user-joined', callback);
    }
  };

  const onUserLeft = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('user-left');
      socketRef.current.on('user-left', callback);
    }
  };

  const onActiveUsers = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('active-users');
      socketRef.current.on('active-users', callback);
    }
  };

  const onActiveUsersUpdated = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('active-users-updated');
      socketRef.current.on('active-users-updated', callback);
    }
  };

  const onError = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('error');
      socketRef.current.on('error', callback);
    }
  };

  // Comment-related socket functions
  const sendCommentAdded = (documentId, comment) => {
    if (socketRef.current) {
      socketRef.current.emit('comment-added', { documentId, comment });
    }
  };

  const sendCommentUpdated = (documentId, comment) => {
    if (socketRef.current) {
      socketRef.current.emit('comment-updated', { documentId, comment });
    }
  };

  const sendCommentDeleted = (documentId, commentId) => {
    if (socketRef.current) {
      socketRef.current.emit('comment-deleted', { documentId, commentId });
    }
  };

  const sendCommentResolved = (documentId, commentId, isResolved) => {
    if (socketRef.current) {
      socketRef.current.emit('comment-resolved', { documentId, commentId, isResolved });
    }
  };

  const onCommentAdded = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('comment-added', callback);
    }
  };

  const onCommentUpdated = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('comment-updated', callback);
    }
  };

  const onCommentDeleted = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('comment-deleted', callback);
    }
  };

  const onCommentResolved = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('comment-resolved', callback);
    }
  };

  // Suggestion-related socket functions
  const sendSuggestionAdded = (documentId, suggestion) => {
    if (socketRef.current) {
      socketRef.current.emit('suggestion-added', { documentId, suggestion });
    }
  };

  const sendSuggestionResolved = (documentId, suggestionId, action) => {
    if (socketRef.current) {
      socketRef.current.emit('suggestion-resolved', { documentId, suggestionId, action });
    }
  };

  const onSuggestionAdded = (callback) => {
    if (socketRef.current) {
      // Remove any existing listeners first to prevent duplicates
      socketRef.current.off('suggestion-added');
      socketRef.current.on('suggestion-added', callback);
    }
  };

  const onSuggestionResolved = (callback) => {
    if (socketRef.current) {
      // Remove any existing listeners first to prevent duplicates
      socketRef.current.off('suggestion-resolved');
      socketRef.current.on('suggestion-resolved', callback);
    }
  };

  return {
    socket: isInitialized ? socketRef.current : null,
    isInitialized,
    connect,
    disconnect,
    joinDocument,
    leaveDocument,
    sendContentChange,
    sendTitleChange,
    sendCursorPosition,
    sendMousePosition,
    onContentUpdated,
    onTitleUpdated,
    onCursorUpdated,
    onMouseUpdated,
    onUserJoined,
    onUserLeft,
    onActiveUsers,
    onActiveUsersUpdated,
    onError,
    // Comment functions
    sendCommentAdded,
    sendCommentUpdated,
    sendCommentDeleted,
    sendCommentResolved,
    onCommentAdded,
    onCommentUpdated,
    onCommentDeleted,
    onCommentResolved,
    // Suggestion functions
    sendSuggestionAdded,
    sendSuggestionResolved,
    onSuggestionAdded,
    onSuggestionResolved
  };
};

export default useSocket;