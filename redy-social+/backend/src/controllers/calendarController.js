import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

// Get calendar data for a date range
export const getCalendar = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { startDate, endDate, platform, accountId } = req.query;

    let sql = `
      SELECT p.id, p.content, p.media_urls, p.platform, p.post_type, p.status, p.scheduled_at, p.published_at,
             sa.platform_username, sa.profile_data
      FROM posts p
      LEFT JOIN social_accounts sa ON p.account_id = sa.id
      WHERE p.workspace_id = $1
      AND p.status IN ('scheduled', 'published', 'draft')
    `;
    const params = [workspaceId];
    let paramIndex = 2;

    if (startDate) {
      sql += ` AND p.scheduled_at >= $${paramIndex}`;
      params.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND p.scheduled_at <= $${paramIndex}`;
      params.push(new Date(endDate));
      paramIndex++;
    }

    if (platform) {
      sql += ` AND p.platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    if (accountId) {
      sql += ` AND p.account_id = $${paramIndex}`;
      params.push(accountId);
      paramIndex++;
    }

    sql += ` ORDER BY p.scheduled_at ASC`;

    const result = await query(sql, params);

    // Group by date
    const calendarData = {};
    for (const post of result.rows) {
      const dateKey = post.scheduled_at 
        ? new Date(post.scheduled_at).toISOString().split('T')[0]
        : 'drafts';
      
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push(post);
    }

    res.json({ calendar: calendarData, posts: result.rows });
  } catch (error) {
    logger.error('Get calendar error:', error);
    res.status(500).json({ error: 'Failed to get calendar data' });
  }
};

// Move post to different date/time
export const movePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { scheduledAt } = req.body;
    const workspaceId = req.workspace.id;

    const result = await query(
      `UPDATE posts 
       SET scheduled_at = $1, status = 'scheduled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND workspace_id = $3
       RETURNING *`,
      [new Date(scheduledAt), postId, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    logger.info(`Moved post ${postId} to ${scheduledAt}`);
    res.json({ post: result.rows[0] });
  } catch (error) {
    logger.error('Move post error:', error);
    res.status(500).json({ error: 'Failed to move post' });
  }
};
