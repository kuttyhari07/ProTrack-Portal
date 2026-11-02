let io = null;

// Map: projectId -> Map(socketId -> { userId, name, email, avatar, role, joinedAt })
const projectViewers = new Map();

// Map: socketId -> Set(projectId)
const socketProjectMap = new Map();

const getProjectPresenceList = (projectId) => {
  const viewers = projectViewers.get(projectId);
  if (!viewers) return [];

  // Deduplicate by userId
  const uniqueUsers = new Map();
  viewers.forEach((user) => {
    if (user.userId && !uniqueUsers.has(user.userId.toString())) {
      uniqueUsers.set(user.userId.toString(), user);
    }
  });

  return Array.from(uniqueUsers.values());
};

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
    socketProjectMap.set(socket.id, new Set());

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

    // Real-Time Project Live Presence
    socket.on('join_project', ({ projectId, user }) => {
      if (!projectId || !user) return;

      const roomName = `project_${projectId}`;
      socket.join(roomName);

      if (!projectViewers.has(projectId)) {
        projectViewers.set(projectId, new Map());
      }

      projectViewers.get(projectId).set(socket.id, {
        userId: user.id || user._id,
        name: user.name || 'Teammate',
        email: user.email,
        avatar: user.avatar,
        role: user.role || 'Member',
        joinedAt: new Date()
      });

      const socketProjects = socketProjectMap.get(socket.id);
      if (socketProjects) {
        socketProjects.add(projectId);
      }

      // Broadcast active viewers to all sockets in the project
      io.to(roomName).emit('project_presence_update', {
        projectId,
        activeViewers: getProjectPresenceList(projectId)
      });
    });

    socket.on('leave_project', ({ projectId }) => {
      if (!projectId) return;

      const roomName = `project_${projectId}`;
      socket.leave(roomName);

      if (projectViewers.has(projectId)) {
        projectViewers.get(projectId).delete(socket.id);
        if (projectViewers.get(projectId).size === 0) {
          projectViewers.delete(projectId);
        }
      }

      const socketProjects = socketProjectMap.get(socket.id);
      if (socketProjects) {
        socketProjects.delete(projectId);
      }

      io.to(roomName).emit('project_presence_update', {
        projectId,
        activeViewers: getProjectPresenceList(projectId)
      });
    });

    // Real-time Kanban Drag-and-Drop Sync
    socket.on('kanban_drag_sync', (data) => {
      if (data && data.projectId) {
        // Broadcast to other peers in this project room except sender
        socket.to(`project_${data.projectId}`).emit('kanban_card_moved_sync', data);
      }
    });

    // Clean disconnect
    socket.on('disconnect', () => {
      const projects = socketProjectMap.get(socket.id);
      if (projects) {
        projects.forEach((projectId) => {
          if (projectViewers.has(projectId)) {
            projectViewers.get(projectId).delete(socket.id);
            if (projectViewers.get(projectId).size === 0) {
              projectViewers.delete(projectId);
            }
          }
          io.to(`project_${projectId}`).emit('project_presence_update', {
            projectId,
            activeViewers: getProjectPresenceList(projectId)
          });
        });
        socketProjectMap.delete(socket.id);
      }
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

const emitToProject = (projectId, event, data) => {
  if (io && projectId) {
    try {
      io.to(`project_${projectId}`).emit(event, data);
    } catch (err) {
      console.error('[Socket Project Emit Error]:', err.message);
    }
  }
};

module.exports = {
  initSocket,
  emitToWorkspace,
  emitToUser,
  emitToProject,
  getIO: () => io
};
