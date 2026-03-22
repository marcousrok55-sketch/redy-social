import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import postRoutes from './routes/posts.js';
import calendarRoutes from './routes/calendar.js';
import inboxRoutes from './routes/inbox.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import billingRoutes from './routes/billing.js';
import advancedAnalyticsRoutes from './routes/advancedAnalytics.js';
import platformsRoutes from './routes/platforms.js';
import websiteRoutes from './routes/website.js';
import { initDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';
import { setupSocket } from './config/socket.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/analytics/advanced', advancedAnalyticsRoutes);
app.use('/api/platforms', platformsRoutes);
app.use('/api/website', websiteRoutes);

// Error handling
app.use(errorHandler);

// Initialize services and start server
const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initDatabase();
    logger.info('Database connected');
    await initRedis();
    logger.info('Redis connected');
    setupSocket(io);
    logger.info('Socket.io initialized');
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export { io };
