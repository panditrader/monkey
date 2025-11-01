import React, { useState, useEffect } from 'react';
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
    callUser 
  } = usePeer();

  const [roomId, setRoomId] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);

  useEffect(() => {
    if (socket && peerId) {
      // Handle user joined event
      socket.on('userJoined', (data) => {
        setRemoteUser(data);
        callUser(data.peerId);
        setIsSearching(false);
        setIsInRoom(true);
      });

      // Handle user disconnected
      socket.on('userDisconnected', () => {
        setRemoteUser(null);
        setIsInRoom(false);
        // Add reconnection logic if needed
      });

      // Handle room assigned
      socket.on('roomAssigned', (assignedRoomId) => {
        setRoomId(assignedRoomId);
      });
    }

    return () => {
      if (socket) {
        socket.off('userJoined');
        socket.off('userDisconnected');
        socket.off('roomAssigned');
      }
    };
  }, [socket, peerId, callUser]);

  const joinRoom = async () => {
    if (!socket || !peerId) return;

    const stream = await getMediaStream();
    if (!stream) {
      alert('Could not access camera/microphone. Please check permissions.');
      return;
    }

    setIsSearching(true);
    socket.emit('joinRoom', {
      peerId,
      videoOn: true
    });
  };

  const leaveRoom = () => {
    if (socket && roomId) {
      socket.emit('leaveRoom', { roomId });
    }
    setRemoteUser(null);
    setIsInRoom(false);
    setIsSearching(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Video Chat App</h1>
        <div className="status">
          <span>Online: {onlineCount}</span>
          <span className={`connection ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main className="app-main">
        {!isInRoom && !isSearching && (
          <div className="welcome-section">
            <button onClick={joinRoom} className="join-button">
              Start New Chat
            </button>
          </div>
        )}

        {isSearching && (
          <div className="searching-section">
            <p>Searching for a stranger...</p>
            <button onClick={leaveRoom} className="cancel-button">
              Cancel
            </button>
          </div>
        )}

        {isInRoom && (
          <div className="chat-section">
            <VideoChat 
              localStream={localStream}
              remoteStream={remoteStream}
            />
            <Chat socket={socket} roomId={roomId} />
            <button onClick={leaveRoom} className="leave-button">
              Leave Room
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;