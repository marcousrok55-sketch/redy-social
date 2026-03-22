import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

// Get optimal posting times based on historical engagement
export const getOptimalTimes = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { platform, accountId } = req.query;

    // Get published posts with engagement data
    let sql = `
      SELECT p.platform, p.scheduled_at, p.metrics
      FROM posts p
      WHERE p.workspace_id = $1 AND p.status = 'published' AND p.scheduled_at IS NOT NULL
    `;
    const params = [workspaceId];

    if (platform) {
      sql += ` AND p.platform = $2`;
      params.push(platform);
    }

    if (accountId) {
      sql += ` AND p.account_id = $3`;
      params.push(accountId);
    }

    const result = await query(sql, params);

    // Analyze engagement by hour and day of week
    const engagementByHour = {};
    const engagementByDay = {};

    for (const post of result.rows) {
      const date = new Date(post.scheduled_at);
      const hour = date.getHours();
      const day = date.getDay();
      const engagement = parseFloat(post.metrics?.engagement || 0);

      // By hour
      if (!engagementByHour[hour]) {
        engagementByHour[hour] = { total: 0, count: 0 };
      }
      engagementByHour[hour].total += engagement;
      engagementByHour[hour].count++;

      // By day
      if (!engagementByDay[day]) {
        engagementByDay[day] = { total: 0, count: 0 };
      }
      engagementByDay[day].total += engagement;
      engagementByDay[day].count++;
    }

    // Calculate averages
    const hourlyAverages = [];
    for (let hour = 0; hour < 24; hour++) {
      const data = engagementByHour[hour];
      hourlyAverages.push({
        hour,
        avgEngagement: data ? data.total / data.count : 0,
        postCount: data?.count || 0
      });
    }

    const dailyAverages = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (let day = 0; day < 7; day++) {
      const data = engagementByDay[day];
      dailyAverages.push({
        day: dayNames[day],
        dayIndex: day,
        avgEngagement: data ? data.total / data.count : 0,
        postCount: data?.count || 0
      });
    }

    // Find top 3 best times
    const sortedByHour = [...hourlyAverages].sort((a, b) => b.avgEngagement - a.avgEngagement);
    const bestHours = sortedByHour.slice(0, 3).map(h => h.hour);

    const sortedByDay = [...dailyAverages].sort((a, b) => b.avgEngagement - a.avgEngagement);
    const bestDays = sortedByDay.slice(0, 3).map(d => d.day);

    res.json({
      bestHours,
      bestDays,
      hourlyAverages,
      dailyAverages,
      analysis: {
        totalPosts: result.rows.length,
        averageEngagement: result.rows.length > 0 
          ? result.rows.reduce((sum, p) => sum + parseFloat(p.metrics?.engagement || 0), 0) / result.rows.length
          : 0
      }
    });
  } catch (error) {
    logger.error('Get optimal times error:', error);
    res.status(500).json({ error: 'Failed to get optimal times' });
  }
};

// Get content performance by type
export const getContentPerformance = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { platform, accountId } = req.query;

    let sql = `
      SELECT p.platform, p.post_type, 
             AVG((p.metrics->>'likes')::numeric) as avg_likes,
             AVG((p.metrics->>'comments')::numeric) as avg_comments,
             AVG((p.metrics->>'shares')::numeric) as avg_shares,
             AVG((p.metrics->>'engagement')::numeric) as avg_engagement,
             COUNT(*) as post_count
      FROM posts p
      WHERE p.workspace_id = $1 AND p.status = 'published'
    `;
    const params = [workspaceId];
    let paramIndex = 2;

    if (platform) {
      sql += ` AND p.platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    if (accountId) {
      sql += ` AND p.account_id = $${paramIndex}`;
      params.push(accountId);
    }

    sql += ` GROUP BY p.platform, p.post_type ORDER BY avg_engagement DESC`;

    const result = await query(sql, params);

    res.json({ performance: result.rows });
  } catch (error) {
    logger.error('Get content performance error:', error);
    res.status(500).json({ error: 'Failed to get content performance' });
  }
};

// Get hashtag performance
export const getHashtagPerformance = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;

    const result = await query(
      `SELECT p.metrics->'hashtags' as hashtags,
              p.metrics->>'engagement' as engagement
       FROM posts p
       WHERE p.workspace_id = $1 AND p.status = 'published' AND p.metrics->'hashtags' IS NOT NULL`,
      [workspaceId]
    );

    // Aggregate hashtag performance
    const hashtagStats = {};
    
    for (const row of result.rows) {
      const hashtags = row.hashtags;
      const engagement = parseFloat(row.engagement || 0);

      if (Array.isArray(hashtags)) {
        for (const hashtag of hashtags) {
          if (!hashtagStats[hashtag]) {
            hashtagStats[hashtag] = { totalEngagement: 0, count: 0 };
          }
          hashtagStats[hashtag].totalEngagement += engagement;
          hashtagStats[hashtag].count++;
        }
      }
    }

    // Calculate averages and sort
    const hashtagPerformance = Object.entries(hashtagStats)
      .map(([hashtag, stats]) => ({
        hashtag,
        avgEngagement: stats.totalEngagement / stats.count,
        count: stats.count,
        totalEngagement: stats.totalEngagement
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement)
      .slice(0, 50); // Top 50 hashtags

    res.json({ hashtags: hashtagPerformance });
  } catch (error) {
    logger.error('Get hashtag performance error:', error);
    res.status(500).json({ error: 'Failed to get hashtag performance' });
  }
};

// Export analytics report
export const exportReport = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { format = 'json', startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get posts
    const postsResult = await query(
      `SELECT * FROM posts 
       WHERE workspace_id = $1 AND status = 'published' 
       AND published_at BETWEEN $2 AND $3`,
      [workspaceId, start, end]
    );

    // Get analytics
    const analyticsResult = await query(
      `SELECT ad.*, sa.platform
       FROM analytics_data ad
       JOIN social_accounts sa ON ad.account_id = sa.id
       WHERE ad.workspace_id = $1 AND ad.date BETWEEN $2 AND $3`,
      [workspaceId, start, end]
    );

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Post ID', 'Platform', 'Content', 'Published At', 'Likes', 'Comments', 'Shares', 'Engagement'];
      const rows = postsResult.rows.map(p => [
        p.id,
        p.platform,
        `"${(p.content || '').replace(/"/g, '""')}"`,
        p.published_at,
        p.metrics?.likes || 0,
        p.metrics?.comments || 0,
        p.metrics?.shares || 0,
        p.metrics?.engagement || 0
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.csv');
      res.send(csv);
    } else {
      res.json({
        period: { start, end },
        posts: postsResult.rows,
        analytics: analyticsResult.rows,
        generatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Export report error:', error);
    res.status(500).json({ error: 'Failed to export report' });
  }
};
