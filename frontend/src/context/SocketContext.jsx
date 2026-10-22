import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) socket.disconnect();
      return;
    }

    const socketInstance = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      if (user.id || user._id) {
        socketInstance.emit('join_user', user.id || user._id);
      }
      if (currentWorkspace?._id) {
        socketInstance.emit('join_workspace', currentWorkspace._id);
      }
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user?.id, user?._id]);

  useEffect(() => {
    if (socket && connected && currentWorkspace?._id) {
      socket.emit('join_workspace', currentWorkspace._id);
    }
  }, [socket, connected, currentWorkspace?._id]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
