// API Service for frontend - handles all backend communication

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  switchWorkspace: (workspaceId) => api.post('/auth/switch-workspace', { workspaceId })
};

// Accounts API
export const accountsApi = {
  getAll: () => api.get('/accounts'),
  getById: (id) => api.get(`/accounts/${id}`),
  connect: (platform) => api.post(`/accounts/connect/${platform}`),
  disconnect: (id) => api.delete(`/accounts/${id}`),
  refresh: (id) => api.post(`/accounts/${id}/refresh`),
  getAnalytics: (id, params) => api.get(`/accounts/${id}/analytics`, { params })
};

// Posts API
export const postsApi = {
  getAll: (params) => api.get('/posts', { params }),
  getById: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  delete: (id) => api.delete(`/posts/${id}`),
  duplicate: (id) => api.post(`/posts/${id}/duplicate`),
  bulkCreate: (posts) => api.post('/posts/bulk', { posts }),
  bulkDelete: (ids) => api.delete('/posts/bulk', { data: { ids } })
};

// Calendar API
export const calendarApi = {
  getEvents: (params) => api.get('/calendar', { params }),
  movePost: (postId, newDate) => api.put(`/calendar/${postId}/move`, { scheduledAt: newDate }),
  getOptimalTimes: (platform) => api.get('/calendar/optimal-times', { params: { platform } })
};

// Inbox API
export const inboxApi = {
  getAll: (params) => api.get('/inbox', { params }),
  getById: (id) => api.get(`/inbox/${id}`),
  markAsRead: (id) => api.put(`/inbox/${id}/read`),
  markAsUnread: (id) => api.put(`/inbox/${id}/unread`),
  star: (id) => api.put(`/inbox/${id}/star`),
  unstar: (id) => api.put(`/inbox/${id}/unstar`),
  reply: (id, message) => api.post(`/inbox/${id}/reply`, { message }),
  getQuickReplies: () => api.get('/inbox/quick-replies'),
  createQuickReply: (data) => api.post('/inbox/quick-replies', data),
  deleteQuickReply: (id) => api.delete(`/inbox/quick-replies/${id}`)
};

// Analytics API
export const analyticsApi = {
  getOverview: (params) => api.get('/analytics/overview', { params }),
  getPlatform: (platform, params) => api.get(`/analytics/${platform}`, { params }),
  getCompetitors: () => api.get('/analytics/competitors'),
  getTopPosts: (params) => api.get('/analytics/top-posts', { params }),
  getBestTimes: () => api.get('/analytics/best-times'),
  exportReport: (format) => api.get('/analytics/export', { params: { format } })
};

// AI API
export const aiApi = {
  generate: (prompt, options) => api.post('/ai/generate', { prompt, ...options }),
  improve: (content, type) => api.post('/ai/improve', { content, type }),
  translate: (content, language) => api.post('/ai/translate', { content, language }),
  getHashtags: (content, platform) => api.post('/ai/hashtags', { content, platform }),
  generateFromUrl: (url, platform) => api.post('/ai/from-url', { url, platform }),
  getVariations: (content, count) => api.post('/ai/variations', { content, count }),
  analyzeSentiment: (content) => api.post('/ai/sentiment', { content })
};

// Billing API
export const billingApi = {
  getSubscription: () => api.get('/billing/subscription'),
  createCheckout: (plan, successUrl, cancelUrl) => 
    api.post('/billing/checkout', { plan, successUrl, cancelUrl }),
  cancelSubscription: () => api.post('/billing/cancel'),
  getInvoices: () => api.get('/billing/invoices'),
  getPortalUrl: () => api.get('/billing/portal')
};

// Settings API
export const settingsApi = {
  getProfile: () => api.get('/settings/profile'),
  updateProfile: (data) => api.put('/settings/profile', data),
  getTeam: () => api.get('/settings/team'),
  inviteMember: (email, role) => api.post('/settings/team/invite', { email, role }),
  removeMember: (userId) => api.delete(`/settings/team/${userId}`),
  updateMemberRole: (userId, role) => api.put(`/settings/team/${userId}/role`, { role }),
  getApiKeys: () => api.get('/settings/api-keys'),
  createApiKey: (name) => api.post('/settings/api-keys', { name }),
  deleteApiKey: (id) => api.delete(`/settings/api-keys/${id}`)
};

// Notifications API
export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  delete: (id) => api.delete(`/notifications/${id}`)
};

// WebSocket service
class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join/leave rooms
  joinWorkspace(workspaceId) {
    this.socket?.emit('join:workspace', workspaceId);
  }

  joinPost(postId) {
    this.socket?.emit('join:post', postId);
  }

  leavePost(postId) {
    this.socket?.emit('leave:post', postId);
  }

  // Events
  on(event, callback) {
    this.socket?.on(event, callback);
    this.listeners.set(event, callback);
  }

  off(event) {
    this.socket?.off(event, this.listeners.get(event));
    this.listeners.delete(event);
  }

  // Typing indicators
  startTyping(conversationId) {
    this.socket?.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId) {
    this.socket?.emit('typing:stop', { conversationId });
  }

  // Post updates
  onPostCreated(callback) {
    this.socket?.on('post:created', callback);
  }

  onPostUpdated(callback) {
    this.socket?.on('post:updated', callback);
  }

  onPostDeleted(callback) {
    this.socket?.on('post:deleted', callback);
  }

  // Inbox updates
  onNewMessage(callback) {
    this.socket?.on('inbox:new-reply', callback);
  }

  onMessageRead(callback) {
    this.socket?.on('inbox:message-read', callback);
  }

  // Notifications
  onNotification(callback) {
    this.socket?.on('notification:new', callback);
  }
}

export const socketService = new SocketService();

export default api;
