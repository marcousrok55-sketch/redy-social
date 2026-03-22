import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

// Get inbox messages
export const getMessages = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { platform, isRead, isStarred, isPending, accountId, page = 1, limit = 50 } = req.query;

    let sql = `
      SELECT im.*, sa.platform, sa.platform_username
      FROM inbox_messages im
      LEFT JOIN social_accounts sa ON im.account_id = sa.id
      WHERE im.workspace_id = $1
    `;
    const params = [workspaceId];
    let paramIndex = 2;

    if (platform) {
      sql += ` AND sa.platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    if (isRead !== undefined) {
      sql += ` AND im.is_read = $${paramIndex}`;
      params.push(isRead === 'true');
      paramIndex++;
    }

    if (isStarred !== undefined) {
      sql += ` AND im.is_starred = $${paramIndex}`;
      params.push(isStarred === 'true');
      paramIndex++;
    }

    if (isPending !== undefined) {
      sql += ` AND im.is_pending = $${paramIndex}`;
      params.push(isPending === 'true');
      paramIndex++;
    }

    if (accountId) {
      sql += ` AND im.account_id = $${paramIndex}`;
      params.push(accountId);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(sql.replace('SELECT im.*, sa.platform, sa.platform_username', 'SELECT COUNT(*)'), params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination and ordering
    sql += ` ORDER BY im.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);

    // Get unread count
    const unreadResult = await query(
      'SELECT COUNT(*) FROM inbox_messages WHERE workspace_id = $1 AND is_read = false',
      [workspaceId]
    );

    res.json({
      messages: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get inbox messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace.id;
    const { isRead } = req.body;

    const result = await query(
      `UPDATE inbox_messages 
       SET is_read = $1 
       WHERE id = $2 AND workspace_id = $3
       RETURNING *`,
      [isRead !== undefined ? isRead : true, id, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: result.rows[0] });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// Mark message as starred
export const markAsStarred = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace.id;
    const { isStarred } = req.body;

    const result = await query(
      `UPDATE inbox_messages 
       SET is_starred = $1 
       WHERE id = $2 AND workspace_id = $3
       RETURNING *`,
      [isStarred !== undefined ? isStarred : true, id, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: result.rows[0] });
  } catch (error) {
    logger.error('Mark as starred error:', error);
    res.status(500).json({ error: 'Failed to mark as starred' });
  }
};

// Reply to a message
export const replyToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace.id;
    const { content, mediaUrl } = req.body;

    // Get the message and account
    const messageResult = await query(
      `SELECT im.*, sa.platform, sa.access_token 
       FROM inbox_messages im
       LEFT JOIN social_accounts sa ON im.account_id = sa.id
       WHERE im.id = $1 AND im.workspace_id = $2`,
      [id, workspaceId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const message = messageResult.rows[0];

    // TODO: Actually reply via social platform API
    // For now, just save the reply

    // Update message as replied
    const result = await query(
      `UPDATE inbox_messages 
       SET replied_at = CURRENT_TIMESTAMP, is_pending = false
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    logger.info(`Replied to message ${id}`);
    res.json({ message: result.rows[0], reply: { content, mediaUrl } });
  } catch (error) {
    logger.error('Reply to message error:', error);
    res.status(500).json({ error: 'Failed to reply to message' });
  }
};

// Get quick replies
export const getQuickReplies = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;

    const result = await query(
      'SELECT * FROM quick_replies WHERE workspace_id = $1 ORDER BY created_at DESC',
      [workspaceId]
    );

    res.json({ quickReplies: result.rows });
  } catch (error) {
    logger.error('Get quick replies error:', error);
    res.status(500).json({ error: 'Failed to get quick replies' });
  }
};

// Create quick reply
export const createQuickReply = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { title, content } = req.body;

    const result = await query(
      `INSERT INTO quick_replies (workspace_id, title, content) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [workspaceId, title, content]
    );

    res.status(201).json({ quickReply: result.rows[0] });
  } catch (error) {
    logger.error('Create quick reply error:', error);
    res.status(500).json({ error: 'Failed to create quick reply' });
  }
};

// Delete quick reply
export const deleteQuickReply = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace.id;

    await query(
      'DELETE FROM quick_replies WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    );

    res.json({ message: 'Quick reply deleted' });
  } catch (error) {
    logger.error('Delete quick reply error:', error);
    res.status(500).json({ error: 'Failed to delete quick reply' });
  }
};
