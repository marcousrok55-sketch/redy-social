import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

let io;

export function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      logger.error('Socket auth error:', error);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.userId}`);

    // Join user's workspace room
    socket.join(`workspace:${socket.user.workspaceId}`);

    // Handle joining specific rooms
    socket.on('join:post', (postId) => {
      socket.join(`post:${postId}`);
      logger.info(`User ${socket.user.userId} joined post room: ${postId}`);
    });

    socket.on('leave:post', (postId) => {
      socket.leave(`post:${postId}`);
    });

    // Handle workspace switching
    socket.on('switch:workspace', (workspaceId) => {
      socket.leave(`workspace:${socket.user.workspaceId}`);
      socket.user.workspaceId = workspaceId;
      socket.join(`workspace:${workspaceId}`);
      logger.info(`User ${socket.user.userId} switched to workspace: ${workspaceId}`);
    });

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      socket.to(`workspace:${socket.user.workspaceId}`).emit('user:typing', {
        userId: socket.user.userId,
        ...data
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`workspace:${socket.user.workspaceId}`).emit('user:stopped-typing', {
        userId: socket.user.userId,
        ...data
      });
    });

    // Handle real-time post updates
    socket.on('post:create', async (data) => {
      io.to(`workspace:${socket.user.workspaceId}`).emit('post:created', {
        ...data,
        userId: socket.user.userId
      });
    });

    socket.on('post:update', (data) => {
      io.to(`workspace:${socket.user.workspaceId}`).emit('post:updated', {
        ...data,
        userId: socket.user.userId
      });
    });

    socket.on('post:delete', (postId) => {
      io.to(`workspace:${socket.user.workspaceId}`).emit('post:deleted', {
        postId,
        userId: socket.user.userId
      });
    });

    // Handle inbox messages
    socket.on('inbox:read', (messageId) => {
      io.to(`workspace:${socket.user.workspaceId}`).emit('inbox:message-read', {
        messageId,
        userId: socket.user.userId
      });
    });

    socket.on('inbox:reply', (data) => {
      io.to(`workspace:${socket.user.workspaceId}`).emit('inbox:new-reply', {
        ...data,
        userId: socket.user.userId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.userId}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  return io;
}

// Utility functions to emit events from controllers
export function emitToWorkspace(workspaceId, event, data) {
  if (io) {
    io.to(`workspace:${workspaceId}`).emit(event, data);
  }
}

export function emitToPost(postId, event, data) {
  if (io) {
    io.to(`post:${postId}`).emit(event, data);
  }
}

export function emitToUser(userId, event, data) {
  if (io) {
    io.emit(`user:${userId}`, event, data);
  }
}

// Broadcast functions for admin actions
export function broadcastToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

export function getConnectedUsers() {
  if (!io) return [];
  
  const users = new Map();
  
  io.sockets.sockets.forEach((socket) => {
    if (socket.user) {
      users.set(socket.user.userId, {
        userId: socket.user.userId,
        workspaceId: socket.user.workspaceId,
        socketId: socket.id
      });
    }
  });
  
  return Array.from(users.values());
}

export function getWorkspaceUsers(workspaceId) {
  if (!io) return [];
  
  const workspace = io.sockets.adapter.rooms.get(`workspace:${workspaceId}`);
  if (!workspace) return [];
  
  const users = [];
  workspace.forEach((socketId) => {
    const socket = io.sockets.sockets.get(socketId);
    if (socket && socket.user) {
      users.push({
        userId: socket.user.userId,
        socketId: socket.id
      });
    }
  });
  
  return users;
}

export default {
  setupSocket,
  emitToWorkspace,
  emitToPost,
  emitToUser,
  broadcastToAll,
  getConnectedUsers,
  getWorkspaceUsers
};
