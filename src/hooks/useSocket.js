import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = (url = 'https://omegle-ch7k.onrender.com') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const socketInstance = io(url);
    
    socketInstance.on('connect', () => {
      setIsConnected(true);
      setSocket(socketInstance);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('onlineCount', (count) => {
      setOnlineCount(count);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [url]);

  return { socket, isConnected, onlineCount };
};