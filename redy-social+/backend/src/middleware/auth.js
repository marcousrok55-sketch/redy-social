import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const userResult = await query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      userId: decoded.userId,
      workspaceId: decoded.workspaceId,
      role: userResult.rows[0].role,
      email: userResult.rows[0].email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    logger.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    next();
  };
};

export const workspaceAccess = async (req, res, next) => {
  try {
    const workspaceId = req.user.workspaceId;
    const userId = req.user.userId;

    const accessResult = await query(
      `SELECT w.id, w.name, w.plan, w.owner_id, tm.role as team_role
       FROM workspaces w
       LEFT JOIN team_members tm ON w.id = tm.workspace_id AND tm.user_id = $1
       WHERE w.id = $2`,
      [userId, workspaceId]
    );

    if (accessResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const workspace = accessResult.rows[0];
    req.workspace = {
      id: workspace.id,
      name: workspace.name,
      plan: workspace.plan,
      ownerId: workspace.owner_id,
      role: workspace.owner_id === userId ? 'owner' : workspace.team_role || 'viewer'
    };

    next();
  } catch (error) {
    logger.error('Workspace access error:', error);
    res.status(500).json({ error: 'Failed to verify workspace access' });
  }
};
