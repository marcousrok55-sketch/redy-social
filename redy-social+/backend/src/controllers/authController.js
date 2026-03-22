import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role, created_at',
      [email, passwordHash, name]
    );
    const user = result.rows[0];

    // Create default workspace
    const workspaceResult = await query(
      'INSERT INTO workspaces (name, owner_id) VALUES ($1, $2) RETURNING id, name, plan',
      [`${name}'s Workspace`, user.id]
    );
    const workspace = workspaceResult.rows[0];

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, workspaceId: workspace.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        plan: workspace.plan
      },
      accessToken
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query(
      'SELECT id, email, password_hash, name, avatar, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user's workspaces
    const workspaceResult = await query(
      'SELECT id, name, plan FROM workspaces WHERE owner_id = $1',
      [user.id]
    );
    const workspace = workspaceResult.rows[0];

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, workspaceId: workspace.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        plan: workspace.plan
      },
      accessToken
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!token) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Get user
    const userResult = await query(
      'SELECT id, email, name, avatar, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get workspace
    const workspaceResult = await query(
      'SELECT id, name, plan FROM workspaces WHERE owner_id = $1',
      [user.id]
    );
    const workspace = workspaceResult.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: user.id, workspaceId: workspace.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        plan: workspace.plan
      },
      accessToken
    });
  } catch (error) {
    logger.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await query(
      'SELECT id, email, name, avatar, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get workspaces
    const workspaceResult = await query(
      'SELECT id, name, plan, created_at FROM workspaces WHERE owner_id = $1 OR id IN (SELECT workspace_id FROM team_members WHERE user_id = $1)',
      [userId]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.created_at
      },
      workspaces: workspaceResult.rows
    });
  } catch (error) {
    logger.error('Me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

export const switchWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.body;
    const userId = req.user.userId;

    // Verify user has access to workspace
    const accessResult = await query(
      `SELECT w.id, w.name, w.plan FROM workspaces w 
       LEFT JOIN team_members tm ON w.id = tm.workspace_id 
       WHERE w.id = $1 AND (w.owner_id = $2 OR tm.user_id = $2)`,
      [workspaceId, userId]
    );

    if (accessResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this workspace' });
    }

    const workspace = accessResult.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { userId, workspaceId: workspace.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '15m' }
    );

    res.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        plan: workspace.plan
      },
      accessToken
    });
  } catch (error) {
    logger.error('Switch workspace error:', error);
    res.status(500).json({ error: 'Failed to switch workspace' });
  }
};
