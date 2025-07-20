import { useState, useEffect, useRef, useCallback } from 'react';
import useSocket from './useSocket';

export const useWebRTC = (documentId, userId, onCursorUpdate) => {
  const [peers, setPeers] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('connecting');
  const localConnection = useRef(null);
  const dataChannels = useRef({});
  const pendingICECandidates = useRef({});
  const { socket } = useSocket();

  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  };

  // Initialize WebRTC
  const initializeWebRTC = useCallback(() => {
    if (!socket || !documentId || !userId) return;

    try {
      localConnection.current = new RTCPeerConnection(configuration);
      
      // Handle ICE candidates
      localConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            documentId,
            candidate: event.candidate,
            userId
          });
        }
      };

      // Handle connection state changes
      localConnection.current.onconnectionstatechange = () => {
        const state = localConnection.current.connectionState;
        setConnectionState(state);
        setIsConnected(state === 'connected');
      };

      // Handle data channels
      localConnection.current.ondatachannel = (event) => {
        const channel = event.channel;
        const peerId = channel.label;
        
        channel.onopen = () => {
          console.log(`Data channel opened with ${peerId}`);
          dataChannels.current[peerId] = channel;
        };

        channel.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWebRTCMessage(data, peerId);
        };

        channel.onclose = () => {
          console.log(`Data channel closed with ${peerId}`);
          delete dataChannels.current[peerId];
        };
      };

    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      setConnectionState('failed');
    }
  }, [socket, documentId, userId]);

  // Handle WebRTC messages
  const handleWebRTCMessage = useCallback((data, peerId) => {
    switch (data.type) {
      case 'content-update':
        // Handle real-time content updates
        if (window.editorInstance) {
          window.editorInstance.commands.setContent(data.content);
        }
        break;
      case 'cursor-update':
        // Handle cursor position updates
        if (onCursorUpdate) {
          onCursorUpdate(peerId, data);
        }
        break;
      case 'user-typing':
        // Handle typing indicators
        console.log(`${peerId} is typing...`);
        break;
      default:
        console.log('Unknown WebRTC message:', data);
    }
  }, [onCursorUpdate]);

  // Send data through WebRTC
  const sendWebRTCData = useCallback((data) => {
    Object.values(dataChannels.current).forEach(channel => {
      if (channel.readyState === 'open') {
        try {
          channel.send(JSON.stringify(data));
        } catch (error) {
          console.error('Failed to send WebRTC data:', error);
        }
      }
    });
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(async (peerId) => {
    try {
      const peerConnection = new RTCPeerConnection(configuration);
      
      // Create data channel for this peer
      const dataChannel = peerConnection.createDataChannel(peerId, {
        ordered: true
      });
      
      dataChannel.onopen = () => {
        console.log(`Data channel opened with ${peerId}`);
        dataChannels.current[peerId] = dataChannel;
      };

      dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebRTCMessage(data, peerId);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            documentId,
            candidate: event.candidate,
            targetPeer: peerId,
            userId
          });
        }
      };

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket.emit('webrtc-offer', {
        documentId,
        offer,
        targetPeer: peerId,
        userId
      });

      setPeers(prev => ({
        ...prev,
        [peerId]: peerConnection
      }));

      return peerConnection;
    } catch (error) {
      console.error('Failed to create peer connection:', error);
      throw error;
    }
  }, [socket, documentId, userId, handleWebRTCMessage]);

  // Handle offer
  const handleOffer = useCallback(async (offer, fromPeer) => {
    try {
      const peerConnection = new RTCPeerConnection(configuration);
      
      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            documentId,
            candidate: event.candidate,
            targetPeer: fromPeer,
            userId
          });
        }
      };

      // Handle data channel
      peerConnection.ondatachannel = (event) => {
        const channel = event.channel;
        dataChannels.current[fromPeer] = channel;
        
        channel.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWebRTCMessage(data, fromPeer);
        };
      };

      await peerConnection.setRemoteDescription(offer);
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('webrtc-answer', {
        documentId,
        answer,
        targetPeer: fromPeer,
        userId
      });

      setPeers(prev => ({
        ...prev,
        [fromPeer]: peerConnection
      }));

      // Process pending ICE candidates
      if (pendingICECandidates.current[fromPeer]) {
        pendingICECandidates.current[fromPeer].forEach(candidate => {
          peerConnection.addIceCandidate(candidate);
        });
        delete pendingICECandidates.current[fromPeer];
      }
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }, [socket, documentId, userId, handleWebRTCMessage]);

  // Handle answer
  const handleAnswer = useCallback(async (answer, fromPeer) => {
    try {
      const peerConnection = peers[fromPeer];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
        
        // Process pending ICE candidates
        if (pendingICECandidates.current[fromPeer]) {
          pendingICECandidates.current[fromPeer].forEach(candidate => {
            peerConnection.addIceCandidate(candidate);
          });
          delete pendingICECandidates.current[fromPeer];
        }
      }
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  }, [peers]);

  // Handle ICE candidate
  const handleICECandidate = useCallback(async (candidate, fromPeer) => {
    try {
      const peerConnection = peers[fromPeer];
      if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(candidate);
      } else {
        // Store candidate for later
        if (!pendingICECandidates.current[fromPeer]) {
          pendingICECandidates.current[fromPeer] = [];
        }
        pendingICECandidates.current[fromPeer].push(candidate);
      }
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  }, [peers]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleICECandidate);

    socket.on('user-joined-webrtc', (data) => {
      const { userId: joinedUserId } = data;
      if (joinedUserId !== userId) {
        createPeerConnection(joinedUserId);
      }
    });

    socket.on('user-left-webrtc', (data) => {
      const { userId: leftUserId } = data;
      if (peers[leftUserId]) {
        peers[leftUserId].close();
        delete dataChannels.current[leftUserId];
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[leftUserId];
          return newPeers;
        });
      }
    });

    return () => {
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleICECandidate);
      socket.off('user-joined-webrtc');
      socket.off('user-left-webrtc');
    };
  }, [socket, handleOffer, handleAnswer, handleICECandidate, createPeerConnection, peers, userId]);

  // Initialize WebRTC when dependencies are ready
  useEffect(() => {
    if (socket && documentId && userId) {
      initializeWebRTC();
      
      // Join WebRTC room
      socket.emit('join-webrtc-room', { documentId, userId });
    }

    return () => {
      // Cleanup on unmount
      if (localConnection.current) {
        localConnection.current.close();
      }
      
      Object.values(dataChannels.current).forEach(channel => {
        if (channel.readyState === 'open') {
          channel.close();
        }
      });
      
      Object.values(peers).forEach(peer => {
        peer.close();
      });
      
      if (socket) {
        socket.emit('leave-webrtc-room', { documentId, userId });
      }
    };
  }, [socket, documentId, userId, initializeWebRTC]);

  return {
    isConnected,
    connectionState,
    peers: Object.keys(peers),
    sendWebRTCData,
    sendContentUpdate: (content) => sendWebRTCData({ type: 'content-update', content }),
    sendCursorUpdate: (position) => sendWebRTCData({ type: 'cursor-update', position }),
    sendTypingIndicator: () => sendWebRTCData({ type: 'user-typing', userId })
  };
};

export default useWebRTC;