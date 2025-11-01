import React, { useEffect, useRef } from 'react';

export const VideoChat = ({ localStream, remoteStream }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="video-chat">
      <div className="video-container">
        <div className="video-wrapper">
          <h3>Your Video</h3>
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline
            className="video-element"
          />
        </div>
        <div className="video-wrapper">
          <h3>Stranger's Video</h3>
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
            className="video-element"
          />
        </div>
      </div>
    </div>
  );
};