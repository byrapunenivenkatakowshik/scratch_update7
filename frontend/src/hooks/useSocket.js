import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import config from '../config/config';

const useSocket = () => {
  const socketRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(config.wsUrl, {
      transports: ['websocket'],
      autoConnect: false
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
      socketRef.current.on('content-updated', callback);
    }
  };

  const onTitleUpdated = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('title-updated', callback);
    }
  };

  const onCursorUpdated = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('cursor-updated', callback);
    }
  };

  const onMouseUpdated = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('mouse-updated', callback);
    }
  };

  const onUserJoined = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user-joined', callback);
    }
  };

  const onUserLeft = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user-left', callback);
    }
  };

  const onActiveUsers = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('active-users', callback);
    }
  };

  const onActiveUsersUpdated = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('active-users-updated', callback);
    }
  };

  const onError = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('error', callback);
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
    onError
  };
};

export default useSocket;