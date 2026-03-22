import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

// Get overview analytics for all accounts
export const getOverview = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get connected accounts
    const accountsResult = await query(
      `SELECT id, platform, platform_username, profile_data 
       FROM social_accounts 
       WHERE workspace_id = $1 AND is_active = true`,
      [workspaceId]
    );

    const accounts = accountsResult.rows;

    // Aggregate analytics
    const analyticsResult = await query(
      `SELECT ad.account_id, ad.data_type, 
              ad.metrics->>'followers' as followers,
              ad.metrics->>'engagement' as engagement,
              ad.metrics->>'reach' as reach,
              ad.metrics->>'impressions' as impressions,
              ad.date
       FROM analytics_data ad
       WHERE ad.workspace_id = $1 
       AND ad.date BETWEEN $2 AND $3
       ORDER BY ad.date ASC`,
      [workspaceId, start, end]
    );

    // Calculate totals
    const totals = {
      followers: 0,
      engagement: 0,
      reach: 0,
      impressions: 0,
      posts: 0
    };

    // Get posts count
    const postsResult = await query(
      `SELECT COUNT(*) as count FROM posts 
       WHERE workspace_id = $1 
       AND status = 'published' 
       AND published_at BETWEEN $2 AND $3`,
      [workspaceId, start, end]
    );
    totals.posts = parseInt(postsResult.rows[0].count);

    // Calculate growth (compare first and last data points)
    const byDate = {};
    for (const row of analyticsResult.rows) {
      const date = row.date.toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = { followers: 0, engagement: 0, reach: 0, impressions: 0 };
      }
      byDate[date].followers += parseInt(row.followers || 0);
      byDate[date].engagement += parseFloat(row.engagement || 0);
      byDate[date].reach += parseInt(row.reach || 0);
      byDate[date].impressions += parseInt(row.impressions || 0);
    }

    const dates = Object.keys(byDate).sort();
    if (dates.length > 0) {
      totals.followers = byDate[dates[dates.length - 1]].followers;
      totals.engagement = byDate[dates[dates.length - 1]].engagement;
      totals.reach = byDate[dates[dates.length - 1]].reach;
      totals.impressions = byDate[dates[dates.length - 1]].impressions;
    }

    // Get top posts
    const topPostsResult = await query(
      `SELECT p.id, p.content, p.platform, p.published_at,
              p.metrics->>'likes' as likes,
              p.metrics->>'comments' as comments,
              p.metrics->>'shares' as shares,
              p.metrics->>'engagement' as engagement
       FROM posts p
       WHERE p.workspace_id = $1 AND p.status = 'published'
       ORDER BY (p.metrics->>'engagement')::numeric DESC
       LIMIT 5`,
      [workspaceId]
    );

    res.json({
      accounts,
      totals,
      byDate,
      topPosts: topPostsResult.rows,
      period: { start, end }
    });
  } catch (error) {
    logger.error('Get overview analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

// Get platform-specific analytics
export const getPlatformAnalytics = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { platform } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get accounts for platform
    const accountsResult = await query(
      `SELECT id, platform, platform_username, profile_data 
       FROM social_accounts 
       WHERE workspace_id = $1 AND platform = $2 AND is_active = true`,
      [workspaceId, platform]
    );

    if (accountsResult.rows.length === 0) {
      return res.json({ 
        accounts: [], 
        analytics: [], 
        message: 'No accounts connected for this platform' 
      });
    }

    const accountIds = accountsResult.rows.map(a => a.id);

    // Get analytics data
    const analyticsResult = await query(
      `SELECT ad.account_id, ad.data_type, ad.metrics, ad.date
       FROM analytics_data ad
       WHERE ad.account_id = ANY($1) 
       AND ad.date BETWEEN $2 AND $3
       ORDER BY ad.date ASC`,
      [accountIds, start, end]
    );

    // Get posts for platform
    const postsResult = await query(
      `SELECT id, content, media_urls, published_at, metrics
       FROM posts
       WHERE workspace_id = $1 AND platform = $2 AND status = 'published'
       AND published_at BETWEEN $3 AND $4
       ORDER BY published_at DESC`,
      [workspaceId, platform, start, end]
    );

    res.json({
      accounts: accountsResult.rows,
      analytics: analyticsResult.rows,
      posts: postsResult.rows,
      period: { start, end }
    });
  } catch (error) {
    logger.error('Get platform analytics error:', error);
    res.status(500).json({ error: 'Failed to get platform analytics' });
  }
};

// Get competitors list
export const getCompetitors = async (req, res) => {
  try {
    // This would be stored in a competitors table
    // For now, return empty
    res.json({ competitors: [] });
  } catch (error) {
    logger.error('Get competitors error:', error);
    res.status(500).json({ error: 'Failed to get competitors' });
  }
};

// Add competitor
export const addCompetitor = async (req, res) => {
  try {
    // This would save to a competitors table
    res.status(201).json({ message: 'Competitor added', competitor: req.body });
  } catch (error) {
    logger.error('Add competitor error:', error);
    res.status(500).json({ error: 'Failed to add competitor' });
  }
};

// Remove competitor
export const removeCompetitor = async (req, res) => {
  try {
    res.json({ message: 'Competitor removed' });
  } catch (error) {
    logger.error('Remove competitor error:', error);
    res.status(500).json({ error: 'Failed to remove competitor' });
  }
};
