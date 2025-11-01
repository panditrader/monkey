import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

export const usePeer = () => {
  const [peer, setPeer] = useState(null);
  const [peerId, setPeerId] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    const peerInstance = new Peer();
    
    peerInstance.on('open', (id) => {
      setPeerId(id);
      setPeer(peerInstance);
    });

    peerInstance.on('call', (call) => {
      if (localStream) {
        call.answer(localStream);
        call.on('stream', (remoteStream) => {
          setRemoteStream(remoteStream);
        });
      }
    });

    return () => {
      peerInstance.destroy();
    };
  }, []);

  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      return null;
    }
  };

  const callUser = (remotePeerId) => {
    if (peer && localStream) {
      const call = peer.call(remotePeerId, localStream);
      call.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });
    }
  };

  return {
    peer,
    peerId,
    localStream,
    remoteStream,
    getMediaStream,
    callUser
  };
};