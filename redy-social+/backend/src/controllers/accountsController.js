import { query } from '../../config/database.js';
import logger from '../utils/logger.js';

// Get all connected accounts for workspace
export const getAccounts = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;

    const result = await query(
      `SELECT sa.*, 
              (SELECT COUNT(*) FROM posts WHERE account_id = sa.id) as posts_count
       FROM social_accounts sa
       WHERE sa.workspace_id = $1 AND sa.is_active = true
       ORDER BY sa.platform, sa.connected_at DESC`,
      [workspaceId]
    );

    res.json({ accounts: result.rows });
  } catch (error) {
    logger.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to get accounts' });
  }
};

// Connect a new social account (initiate OAuth)
export const connectAccount = async (req, res) => {
  try {
    const { platform } = req.params;
    const workspaceId = req.workspace.id;

    const platformConfigs = {
      meta: {
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        scope: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_manage_messages,instagram_manage_comments'
      },
      twitter: {
        authUrl: 'https://twitter.com/i/oauth2/authorize',
        scope: 'tweet.read tweet.write users.read follows.read offline.access'
      },
      linkedin: {
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        scope: 'r_liteprofile r_emailaddress w_member_social'
      },
      tiktok: {
        authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
        scope: 'user.info.basic,video.list'
      },
      youtube: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly'
      }
    };

    const config = platformConfigs[platform];
    if (!config) {
      return res.status(400).json({ error: 'Unsupported platform' });
    }

    const redirectUri = process.env[`${platform.toUpperCase()}_REDIRECT_URI`];
    const clientId = process.env[`${platform.toUpperCase()}_APP_ID`] || process.env[`${platform.toUpperCase()}_CLIENT_ID`];

    if (!redirectUri || !clientId) {
      return res.status(500).json({ error: 'Platform not configured' });
    }

    // Generate state with workspace info
    const state = Buffer.from(JSON.stringify({ workspaceId, platform })).toString('base64');

    const authUrl = `${config.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${config.scope}&state=${state}&response_type=code`;

    res.json({ authUrl, platform });
  } catch (error) {
    logger.error('Connect account error:', error);
    res.status(500).json({ error: 'Failed to initiate connection' });
  }
};

// OAuth callback handler
export const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/settings?error=missing_params`);
    }

    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const { workspaceId, platform } = decodedState;

    // Exchange code for tokens based on platform
    let accessToken, refreshToken, expiresIn, platformUserId, platformUsername;

    switch (platform) {
      case 'meta':
        const metaTokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${process.env.META_REDIRECT_URI}&code=${code}`);
        const metaData = await metaTokenResponse.json();
        accessToken = metaData.access_token;
        
        // Get user info
        const metaUserResponse = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${accessToken}`);
        const metaUser = await metaUserResponse.json();
        platformUserId = metaUser.id;
        platformUsername = metaUser.name;
        break;

      case 'twitter':
        const twitterTokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: process.env.TWITTER_API_KEY,
            client_secret: process.env.TWITTER_API_SECRET,
            redirect_uri: process.env.TWITTER_REDIRECT_URI,
            code_verifier: req.session?.codeVerifier || ''
          })
        });
        const twitterData = await twitterTokenResponse.json();
        accessToken = twitterData.access_token;
        refreshToken = twitterData.refresh_token;
        expiresIn = twitterData.expires_in;
        
        // Get user info
        const twitterUserResponse = await fetch('https://api.twitter.com/2/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const twitterUser = await twitterUserResponse.json();
        platformUserId = twitterUser.data.id;
        platformUsername = twitterUser.data.username;
        break;

      default:
        return res.redirect(`${process.env.FRONTEND_URL}/settings?error=unsupported_platform`);
    }

    // Save account to database
    await query(
      `INSERT INTO social_accounts (workspace_id, platform, platform_user_id, platform_username, access_token, refresh_token, token_expires_at, profile_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [workspaceId, platform, platformUserId, platformUsername, accessToken, refreshToken, expiresIn ? new Date(Date.now() + expiresIn * 1000) : null, {}]
    );

    logger.info(`Connected ${platform} account for workspace ${workspaceId}`);
    res.redirect(`${process.env.FRONTEND_URL}/settings?success=connected_${platform}`);
  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/settings?error=connection_failed`);
  }
};

// Disconnect account
export const disconnectAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const workspaceId = req.workspace.id;

    await query(
      'UPDATE social_accounts SET is_active = false WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    );

    logger.info(`Disconnected account ${id}`);
    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    logger.error('Disconnect account error:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
};

// Get account analytics
export const getAccountAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const workspaceId = req.workspace.id;

    // Get account info
    const accountResult = await query(
      'SELECT * FROM social_accounts WHERE id = $1 AND workspace_id = $2',
      [id, workspaceId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get analytics data
    const analyticsResult = await query(
      `SELECT date, data_type, metrics 
       FROM analytics_data 
       WHERE account_id = $1 AND date BETWEEN $2 AND $3
       ORDER BY date ASC`,
      [id, startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate || new Date()]
    );

    res.json({
      account: accountResult.rows[0],
      analytics: analyticsResult.rows
    });
  } catch (error) {
    logger.error('Get account analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};
