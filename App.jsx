import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { usePeer } from './hooks/usePeer';
import { VideoChat } from './components/VideoChat';
import { Chat } from './components/Chat';
import './App.css';

function App() {
  const { socket, isConnected, onlineCount } = useSocket();
  const { 
    peer, 
    peerId, 
    localStream, 
    remoteStream, 
    getMediaStream, 
    callUser,
    disconnectCall,
    isConnected: isPeerConnected
  } = usePeer();

  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);
  const [error, setError] = useState('');

  // Initialize media stream when component mounts
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        await getMediaStream();
      } catch (err) {
        console.error('Failed to get media stream:', err);
        setError('Could not access camera/microphone. Please check permissions.');
      }
    };

    initializeMedia();
  }, [getMediaStream]);

  // Handle socket events
  useEffect(() => {
    if (!socket || !peerId) return;

    const handleUserJoined = async (data) => {
      console.log('User joined:', data);
      setRemoteUser(data);
      setIsSearching(false);
      setIsInRoom(true);
      
      // Wait a bit for streams to initialize before calling
      setTimeout(() => {
        callUser(data.peerId);
      }, 1000);
    };

    const handleUserDisconnected = () => {
      console.log('User disconnected');
      setRemoteUser(null);
      setIsInRoom(false);
      disconnectCall();
    };

    const handleRoomAssigned = (assignedRoomId) => {
      console.log('Room assigned:', assignedRoomId);
      setRoomId(assignedRoomId);
    };

    const handleJoinError = (error) => {
      console.error('Join error:', error);
      setError(error.message || 'Failed to join room');
      setIsSearching(false);
    };

    socket.on('userJoined', handleUserJoined);
    socket.on('userDisconnected', handleUserDisconnected);
    socket.on('roomAssigned', handleRoomAssigned);
    socket.on('joinError', handleJoinError);

    return () => {
      socket.off('userJoined', handleUserJoined);
      socket.off('userDisconnected', handleUserDisconnected);
      socket.off('roomAssigned', handleRoomAssigned);
      socket.off('joinError', handleJoinError);
    };
  }, [socket, peerId, callUser, disconnectCall]);

  const joinRoom = useCallback(async () => {
    if (!socket || !peerId) {
      setError('Not connected to server or peer not ready');
      return;
    }

    setError('');
    
    // Ensure we have media stream
    let stream = localStream;
    if (!stream) {
      stream = await getMediaStream();
      if (!stream) {
        setError('Could not access camera/microphone. Please check permissions.');
        return;
      }
    }

    setIsSearching(true);
    socket.emit('joinRoom', {
      peerId,
      videoOn: true,
      audioOn: true
    });
  }, [socket, peerId, localStream, getMediaStream]);

  const leaveRoom = useCallback(() => {
    if (socket && roomId) {
      socket.emit('leaveRoom', { roomId });
    }
    setRemoteUser(null);
    setIsInRoom(false);
    setIsSearching(false);
    disconnectCall();
    setError('');
  }, [socket, roomId, disconnectCall]);

  // Auto-rejoin if socket reconnects and we were in a room
  useEffect(() => {
    if (socket && isConnected && isInRoom && !remoteUser) {
      // Try to rejoin room if we were disconnected
      socket.emit('joinRoom', {
        peerId,
        videoOn: true,
        audioOn: true
      });
    }
  }, [socket, isConnected, isInRoom, remoteUser, peerId]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Video Chat App</h1>
        <div className="status">
          <span>Online: {onlineCount}</span>
          <span className={`connection ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {isPeerConnected && <span className="peer-status">● Call Active</span>}
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError('')} className="dismiss-error">×</button>
          </div>
        )}

        {!isInRoom && !isSearching && (
          <div className="welcome-section">
            <div className="welcome-content">
              <h2>Start Video Chatting with Strangers</h2>
              <p>Click below to connect with random people online</p>
              <button onClick={joinRoom} className="join-button" disabled={!isConnected}>
                {isConnected ? 'Start New Chat' : 'Connecting...'}
              </button>
              {peerId && (
                <div className="peer-info">
                  <small>Your Peer ID: {peerId}</small>
                </div>
              )}
            </div>
          </div>
        )}

        {isSearching && (
          <div className="searching-section">
            <div className="searching-content">
              <div className="loading-spinner"></div>
              <h3>Searching for a stranger...</h3>
              <p>Please wait while we connect you with someone</p>
              <button onClick={leaveRoom} className="cancel-button">
                Cancel Search
              </button>
            </div>
          </div>
        )}

        {isInRoom && (
          <div className="chat-section">
            <div className="video-container">
              <VideoChat 
                localStream={localStream}
                remoteStream={remoteStream}
                isConnected={isPeerConnected}
                onDisconnect={leaveRoom}
              />
            </div>
            <div className="chat-container">
              <Chat socket={socket} roomId={roomId} />
            </div>
            <div className="room-controls">
              <button onClick={leaveRoom} className="leave-button">
                Leave Room
              </button>
              {remoteUser && (
                <div className="remote-user-info">
                  Connected with: {remoteUser.peerId || 'Stranger'}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
