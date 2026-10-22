let io = null;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // Client joins workspace room
    socket.on('join_workspace', (workspaceId) => {
      if (workspaceId) {
        socket.join(`workspace_${workspaceId}`);
      }
    });

    // Client joins user-specific room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    socket.on('leave_workspace', (workspaceId) => {
      if (workspaceId) {
        socket.leave(`workspace_${workspaceId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

const emitToWorkspace = (workspaceId, event, data) => {
  if (io && workspaceId) {
    try {
      io.to(`workspace_${workspaceId}`).emit(event, data);
    } catch (err) {
      console.error('[Socket Emit Error]:', err.message);
    }
  }
};

const emitToUser = (userId, event, data) => {
  if (io && userId) {
    try {
      io.to(`user_${userId}`).emit(event, data);
    } catch (err) {
      console.error('[Socket User Emit Error]:', err.message);
    }
  }
};

module.exports = {
  initSocket,
  emitToWorkspace,
  emitToUser,
  getIO: () => io
};
