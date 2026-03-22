import logger from '../utils/logger.js';

const connectedUsers = new Map();

export function setupSocket(io) {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join workspace room
    socket.on('join-workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      logger.info(`Socket ${socket.id} joined workspace ${workspaceId}`);
    });

    // Join user room
    socket.on('join-user', (userId) => {
      socket.join(`user:${userId}`);
      connectedUsers.set(userId, socket.id);
      logger.info(`Socket ${socket.id} joined as user ${userId}`);
    });

    // Post published notification
    socket.on('post-published', (data) => {
      const { workspaceId, post } = data;
      io.to(`workspace:${workspaceId}`).emit('post-published', post);
    });

    // New inbox message notification
    socket.on('new-inbox-message', (data) => {
      const { workspaceId, message } = data;
      io.to(`workspace:${workspaceId}`).emit('new-inbox-message', message);
    });

    // Analytics update
    socket.on('analytics-update', (data) => {
      const { workspaceId, accountId, metrics } = data;
      io.to(`workspace:${workspaceId}`).emit('analytics-update', { accountId, metrics });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      // Remove from connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });
  });

  return io;
}

// Helper functions to emit events
export function emitToWorkspace(io, workspaceId, event, data) {
  io.to(`workspace:${workspaceId}`).emit(event, data);
}

export function emitToUser(io, userId, event, data) {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
}

export function broadcast(io, event, data) {
  io.emit(event, data);
}
