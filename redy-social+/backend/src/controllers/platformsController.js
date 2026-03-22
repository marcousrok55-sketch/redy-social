import { query } from '../../config/database.js';
import logger from '../utils/logger.js';
import axios from 'axios';

// Get all supported platforms
export const getSupportedPlatforms = async (req, res) => {
  try {
    const platforms = [
      // Meta Platforms
      { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F', category: 'social', capabilities: ['post', 'story', 'reel', 'carousel'] },
      { id: 'facebook_page', name: 'Facebook Page', icon: '📘', color: '#1877F2', category: 'social', capabilities: ['post', 'story', 'video', 'poll'] },
      { id: 'threads', name: 'Threads', icon: '🧵', color: '#000000', category: 'social', capabilities: ['post', 'reply', 'repost'] },
      
      // Twitter/X
      { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#1DA1F2', category: 'social', capabilities: ['tweet', 'thread', 'reply', 'poll'] },
      
      // LinkedIn
      { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2', category: 'professional', capabilities: ['post', 'article', 'video', 'poll'] },
      
      // TikTok - Beta
      { id: 'tiktok_beta', name: 'TikTok (Beta)', icon: '🎵', color: '#000000', category: 'video', capabilities: ['video', 'photo'], api: 'TikTok API v2 (Beta)' },
      
      // TikTok - Business
      { id: 'tiktok_business', name: 'TikTok Business', icon: '💼', color: '#25F4EE', category: 'video', capabilities: ['video', 'photo', 'ads', 'analytics'], api: 'TikTok for Business API' },
      
      // YouTube
      { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000', category: 'video', capabilities: ['video', 'short', 'live'] },
      { id: 'youtube_short', name: 'YouTube Shorts', icon: '⚡', color: '#FF0000', category: 'video', capabilities: ['short'] },
      
      // Pinterest
      { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#E60023', category: 'visual', capabilities: ['pin', 'board'] },
      
      // Website/Blog
      { id: 'website', name: 'Website/Blog', icon: '🌐', color: '#3366FF', category: 'website', capabilities: ['post', 'page', 'custom'] },
      
      // Reddit
      { id: 'reddit', name: 'Reddit', icon: '🔴', color: '#FF4500', category: 'community', capabilities: ['post', 'reply', 'subreddit'] }
    ];
    res.json({ platforms });
  } catch (error) {
    logger.error('Get platforms error:', error);
    res.status(500).json({ error: 'Failed to get platforms' });
  }
};

// Get platform details with full API info
export const getPlatformDetails = async (req, res) => {
  try {
    const { platform } = req.params;
    const details = {
      instagram: {
        id: 'instagram', name: 'Instagram', description: 'Photo and video sharing',
        api: { name: 'Meta Graph API', version: 'v18.0', auth: 'OAuth 2.0', docs: 'https://developers.facebook.com/docs/instagram' },
        limits: { caption: 2200, hashtag: 30, videoDuration: 60 },
        n8n: { webhookEvents: ['post_published', 'story_published', 'reel_published'], nodeName: 'Instagram' }
      },
      facebook_page: {
        id: 'facebook_page', name: 'Facebook Page', description: 'Business page on Facebook',
        api: { name: 'Meta Graph API', version: 'v18.0', auth: 'OAuth 2.0', docs: 'https://developers.facebook.com/docs/pages' },
        limits: { caption: 63206, videoDuration: 240 },
        n8n: { webhookEvents: ['post_published', 'photo_uploaded', 'video_uploaded'], nodeName: 'Facebook' }
      },
      threads: {
        id: 'threads', name: 'Threads', description: 'Text-based social network by Meta',
        api: { name: 'Threads API', version: 'v1', auth: 'OAuth 2.0', docs: 'https://developers.facebook.com/docs/threads' },
        limits: { caption: 500, mediaLimit: 10 },
        n8n: { webhookEvents: ['post_published', 'reply_posted'], nodeName: 'Threads' }
      },
      twitter: {
        id: 'twitter', name: 'Twitter/X', description: 'Microblogging social network',
        api: { name: 'Twitter API v2', version: 'v2', auth: 'OAuth 2.0', docs: 'https://developer.twitter.com/en/docs/twitter-api' },
        limits: { tweet: 280, extended: 30000, media: 4, videoDuration: 140 },
        n8n: { webhookEvents: ['tweet_published', 'reply_posted', 'retweet_done'], nodeName: 'Twitter' }
      },
      linkedin: {
        id: 'linkedin', name: 'LinkedIn', description: 'Professional networking platform',
        api: { name: 'LinkedIn Marketing API', version: 'v2', auth: 'OAuth 2.0', docs: 'https://learn.microsoft.com/en-us/linkedin/marketing/' },
        limits: { caption: 3000, media: 10, videoDuration: 600 },
        n8n: { webhookEvents: ['post_published', 'article_published', 'video_uploaded'], nodeName: 'LinkedIn' }
      },
      tiktok_beta: {
        id: 'tiktok_beta', name: 'TikTok (Beta)', description: 'Short-form video platform - Beta API',
        category: 'video',
        api: { name: 'TikTok API v2 (Beta)', version: 'Beta', auth: 'OAuth 2.0', docs: 'https://developers.tiktok.com/' },
        endpoints: {
          upload: 'POST /v2/video/upload/',
          user: 'GET /v2/user/info/',
          profile: 'GET /v2/user/profile/'
        },
        limits: { videoDuration: { min: 3, max: 600 }, fileSize: '287MB', aspectRatios: ['9:16', '1:1', '4:3', '3:4'] },
        contentTypes: { video: { formats: ['mp4', 'mov'] }, photo_mix: { maxPhotos: 35 } },
        n8n: { webhookEvents: ['video_published', 'video_completed'], nodeName: 'TikTok' }
      },
      tiktok_business: {
        id: 'tiktok_business', name: 'TikTok Business', description: 'TikTok for Business - Full API Access',
        category: 'video',
        api: { name: 'TikTok for Business API', version: 'v2', auth: 'OAuth 2.0', docs: 'https://business-api.tiktok.com/' },
        endpoints: {
          upload: 'POST /v2/video/upload/',
          user: 'GET /v2/user/info/',
          profile: 'GET /v2/user/profile/',
          analytics: 'GET /v2/report/data/',
          ad_accounts: 'GET /v2/advertiser/account/',
          campaigns: 'GET /v2/campaign/list/'
        },
        features: ['Video Publishing', 'Analytics', 'Ad Management', 'Audience Insights', 'Content Moderation'],
        limits: { videoDuration: { min: 3, max: 600 }, fileSize: '287MB', aspectRatios: ['9:16', '1:1', '4:3', '3:4'] },
        contentTypes: { video: { formats: ['mp4', 'mov'] }, photo_mix: { maxPhotos: 35 } },
        n8n: { webhookEvents: ['video_published', 'video_completed', 'like_received', 'comment_received', 'share_received'], nodeName: 'TikTok Business' }
      },
      youtube: {
        id: 'youtube', name: 'YouTube', description: 'Video sharing platform',
        api: { name: 'YouTube Data API v3', version: 'v3', auth: 'OAuth 2.0', docs: 'https://developers.google.com/youtube/v3' },
        limits: { videoDuration: { min: 33, max: 43200 }, fileSize: '256GB' },
        n8n: { webhookEvents: ['video_published', 'short_published', 'live_started'], nodeName: 'YouTube' }
      },
      pinterest: {
        id: 'pinterest', name: 'Pinterest', description: 'Visual discovery platform',
        api: { name: 'Pinterest API', version: 'v5', auth: 'OAuth 2.0', docs: 'https://developers.pinterest.com/' },
        limits: { imageSize: '20MB', videoSize: '100MB' },
        n8n: { webhookEvents: ['pin_created', 'board_updated'], nodeName: 'Pinterest' }
      },
      website: {
        id: 'website', name: 'Website/Blog', description: 'Custom website posting',
        api: { name: 'REST API / Webhook', auth: 'API Key / Token' },
        supportedCMS: ['WordPress', 'Ghost', 'Webflow', 'Strapi', 'Custom'],
        n8n: { webhookEvents: ['post_published', 'page_created', 'media_uploaded'], nodeName: 'HTTP Request' }
      },
      reddit: {
        id: 'reddit', name: 'Reddit', description: 'Social news and discussion',
        api: { name: 'Reddit API', version: 'v1', auth: 'OAuth 2.0', docs: 'https://www.reddit.com/dev/api/' },
        limits: { title: 300, body: 40000 },
        n8n: { webhookEvents: ['post_submitted', 'comment_posted'], nodeName: 'Reddit' }
      }
    };
    if (!details[platform]) return res.status(404).json({ error: 'Platform not found' });
    res.json({ platform: details[platform] });
  } catch (error) {
    logger.error('Get platform details error:', error);
    res.status(500).json({ error: 'Failed to get platform details' });
  }
};

// Get N8N configurations
export const getN8NConfigurations = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const result = await query(`SELECT * FROM n8n_configs WHERE workspace_id = $1`, [workspaceId]);
    const configs = [
      { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F', webhookUrl: '', enabled: false, events: ['post_published', 'story_published', 'reel_published'] },
      { id: 'facebook_page', name: 'Facebook', icon: '📘', color: '#1877F2', webhookUrl: '', enabled: false, events: ['post_published'] },
      { id: 'threads', name: 'Threads', icon: '🧵', color: '#000000', webhookUrl: '', enabled: false, events: ['post_published'] },
      { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#1DA1F2', webhookUrl: '', enabled: false, events: ['tweet_published'] },
      { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2', webhookUrl: '', enabled: false, events: ['post_published'] },
      { id: 'tiktok_beta', name: 'TikTok (Beta)', icon: '🎵', color: '#000000', webhookUrl: '', enabled: false, events: ['video_published'] },
      { id: 'tiktok_business', name: 'TikTok Business', icon: '💼', color: '#25F4EE', webhookUrl: '', enabled: false, events: ['video_published', 'video_completed', 'analytics_updated'] },
      { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000', webhookUrl: '', enabled: false, events: ['video_published'] },
      { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#E60023', webhookUrl: '', enabled: false, events: ['pin_created'] },
      { id: 'website', name: 'Website', icon: '🌐', color: '#3366FF', webhookUrl: '', enabled: false, events: ['post_published'] },
      { id: 'reddit', name: 'Reddit', icon: '🔴', color: '#FF4500', webhookUrl: '', enabled: false, events: ['post_submitted'] }
    ].map(c => ({ ...c, ...result.rows.find(r => r.platform_id === c.id) }));
    res.json({ configurations: configs });
  } catch (error) {
    logger.error('Get N8N configs error:', error);
    res.status(500).json({ error: 'Failed to get N8N configurations' });
  }
};

// Save N8N configuration
export const saveN8NConfiguration = async (req, res) => {
  try {
    const workspaceId = req.workspace.id;
    const { platformId, webhookUrl, enabled, events, apiKey, headers } = req.body;
    const result = await query(
      `INSERT INTO n8n_configs (workspace_id, platform_id, webhook_url, enabled, events, api_key, headers)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (workspace_id, platform_id) DO UPDATE SET webhook_url = $3, enabled = $4, events = $5, api_key = $6, headers = $7 RETURNING *`,
      [workspaceId, platformId, webhookUrl, enabled, JSON.stringify(events), apiKey, JSON.stringify(headers || {})]
    );
    res.json({ configuration: result.rows[0] });
  } catch (error) {
    logger.error('Save N8N config error:', error);
    res.status(500).json({ error: 'Failed to save N8N configuration' });
  }
};

// Test N8N webhook
export const testN8NWebhook = async (req, res) => {
  try {
    const { webhookUrl, apiKey, headers } = req.body;
    const response = await axios.post(webhookUrl, { test: true, timestamp: new Date().toISOString() }, { headers: { ...headers, 'Authorization': apiKey ? `Bearer ${apiKey}` : undefined }, timeout: 10000 });
    res.json({ success: true, status: response.status, data: response.data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Trigger N8N webhook
export const triggerN8NWebhook = async (platform, event, data) => {
  try {
    const result = await query(`SELECT * FROM n8n_configs WHERE platform_id = $1 AND enabled = true`, [platform]);
    if (result.rows.length === 0) return;
    const config = result.rows[0];
    await axios.post(config.webhook_url, { platform, event, data, timestamp: new Date().toISOString() }, { headers: { ...config.headers, 'Authorization': config.api_key ? `Bearer ${config.api_key}` : undefined }, timeout: 5000 });
    logger.info(`Triggered N8N webhook for ${platform} - ${event}`);
  } catch (error: any) {
    logger.error(`N8N webhook error for ${platform}:`, error.message);
  }
};
