import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

// Get all posts
export const getPosts = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { status, platform, accountId, startDate, endDate, page = 1, limit = 20 } = req.query;

    let sql = `
      SELECT p.*, sa.platform as account_platform, sa.platform_username
      FROM posts p
      LEFT JOIN social_accounts sa ON p.account_id = sa.id
      WHERE p.workspace_id = $1
    `;
    const params = [workspaceId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(status);
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

    // Get total count
    const countResult = await query(sql.replace('SELECT p.*, sa.platform as account_platform, sa.platform_username', 'SELECT COUNT(*)'), params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    sql += ` ORDER BY p.scheduled_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await query(sql, params);

    res.json({
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
};

// Create a new post
export const createPost = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { accountId, content, mediaUrls, platform, postType, scheduledAt } = req.body;

    const result = await query(
      `INSERT INTO posts (workspace_id, account_id, content, media_urls, platform, post_type, status, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        workspaceId,
        accountId,
        content,
        JSON.stringify(mediaUrls || []),
        platform,
        postType || 'post',
        scheduledAt ? 'scheduled' : 'draft',
        scheduledAt ? new Date(scheduledAt) : null
      ]
    );

    logger.info(`Created post ${result.rows[0].id}`);
    res.status(201).json({ post: result.rows[0] });
  } catch (error) {
    logger.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace.id;
    const { content, mediaUrls, platform, postType, scheduledAt, status } = req.body;

    const result = await query(
      `UPDATE posts 
       SET content = COALESCE($1, content),
           media_urls = COALESCE($2, media_urls),
           platform = COALESCE($3, platform),
           post_type = COALESCE($4, post_type),
           scheduled_at = COALESCE($5, scheduled_at),
           status = COALESCE($6, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND workspace_id = $8
       RETURNING *`,
      [content, mediaUrls ? JSON.stringify(mediaUrls) : null, platform, postType, scheduledAt ? new Date(scheduledAt) : null, status, id, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    logger.info(`Updated post ${id}`);
    res.json({ post: result.rows[0] });
  } catch (error) {
    logger.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace.id;

    const result = await query(
      'DELETE FROM posts WHERE id = $1 AND workspace_id = $2 RETURNING id',
      [id, workspaceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    logger.info(`Deleted post ${id}`);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// Bulk create posts
export const bulkCreatePosts = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { posts } = req.body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: 'Posts array required' });
    }

    const createdPosts = [];
    for (const post of posts) {
      const result = await query(
        `INSERT INTO posts (workspace_id, account_id, content, media_urls, platform, post_type, status, scheduled_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          workspaceId,
          post.accountId,
          post.content,
          JSON.stringify(post.mediaUrls || []),
          post.platform,
          post.postType || 'post',
          post.scheduledAt ? 'scheduled' : 'draft',
          post.scheduledAt ? new Date(post.scheduledAt) : null
        ]
      );
      createdPosts.push(result.rows[0]);
    }

    logger.info(`Bulk created ${createdPosts.length} posts`);
    res.status(201).json({ posts: createdPosts });
  } catch (error) {
    logger.error('Bulk create posts error:', error);
    res.status(500).json({ error: 'Failed to bulk create posts' });
  }
};

// Publish a post immediately
export const publishPost = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace.id;

    // Get post details
    const postResult = await query(
      'SELECT * FROM posts WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult.rows[0];

    // TODO: Actually publish to social platform based on account
    // For now, just mark as published
    const result = await query(
      `UPDATE posts 
       SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    logger.info(`Published post ${id}`);
    res.json({ post: result.rows[0] });
  } catch (error) {
    logger.error('Publish post error:', error);
    res.status(500).json({ error: 'Failed to publish post' });
  }
};
