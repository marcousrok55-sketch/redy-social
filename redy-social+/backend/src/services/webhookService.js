import axios from 'axios';
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

// Base webhook service for handling platform webhooks

// Instagram/Facebook Webhooks
export async function handleInstagramWebhook(data, signature) {
  const { object, entry } = data;

  if (object === 'instagram') {
    for (const item of entry) {
      const { id, messaging, changes } = item;

      // Handle messages
      if (messaging) {
        for (const message of messaging) {
          await processInstagramMessage(id, message);
        }
      }

      // Handle changes (e.g., comments, likes)
      if (changes) {
        for (const change of changes) {
          await processInstagramChange(id, change);
        }
      }
    }
  }
}

async function processInstagramMessage(accountId, message) {
  const { sender, message: messageData, timestamp } = message;

  try {
    // Store message in database
    await query(
      `INSERT INTO inbox_messages 
       (workspace_id, account_id, platform_message_id, type, content, from_user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        null, // workspace_id - need to look up from account
        accountId,
        `${sender.id}_${timestamp}`,
        'message',
        messageData.text || '',
        sender.id,
        new Date(timestamp * 1000)
      ]
    );

    logger.info(`Processed Instagram message from ${sender.id}`);
  } catch (error) {
    logger.error('Failed to process Instagram message:', error);
  }
}

async function processInstagramChange(accountId, change) {
  const { field, value } = change;

  logger.info(`Instagram change: ${field}`, value);
  
  // Handle different field types
  switch (field) {
    case 'comments':
      // Process new comments
      break;
    case 'messages':
      // Process new messages
      break;
    case 'insights':
      // Update analytics data
      break;
  }
}

// Twitter/X Webhooks
export async function handleTwitterWebhook(data, tweetCreateEvents) {
  if (!tweetCreateEvents) return;

  for (const event of tweetCreateEvents) {
    const { id, text, user, created_at, entities } = event;

    try {
      // Determine if it's a mention, reply, or DM
      const type = event.type || 'tweet';

      logger.info(`Twitter event: ${type} from ${user.screen_name}`);

      // Store or process accordingly
      switch (type) {
        case 'tweet_create':
          await processTweet(event);
          break;
        case 'follow':
          await processFollow(event);
          break;
        case 'unfollow':
          await processUnfollow(event);
          break;
        case 'block':
          await processBlock(event);
          break;
      }
    } catch (error) {
      logger.error('Failed to process Twitter webhook:', error);
    }
  }
}

async function processTweet(tweet) {
  const { id, text, user, created_at, entities } = tweet;
  
  logger.info(`Processing tweet ${id} from ${user.screen_name}`);
  
  // Extract hashtags, mentions, URLs
  const hashtags = entities?.hashtags?.map(h => h.text) || [];
  const mentions = entities?.user_mentions?.map(m => m.screen_name) || [];
  
  // Store in database if it's a mention or reply
  // (Not all tweets - only those that mention the connected account)
}

// Generic webhook handlers
export async function handleLinkedInWebhook(data) {
  logger.info('LinkedIn webhook received:', data);
  
  // Handle various LinkedIn events
  const { type, ...eventData } = data;
  
  switch (type) {
    case 'share':
      // New post by connected account
      break;
    case 'comment':
      // New comment
      break;
    case 'reaction':
      // New reaction
      break;
  }
}

export async function handleTikTokWebhook(data) {
  logger.info('TikTok webhook received:', data);
  
  const { event, open_id, union_id, ...payload } = data;
  
  switch (event) {
    case 'video.publish':
      // New video published
      break;
    case 'user.update':
      // Profile updated
      break;
    case 'like':
      // Video liked
      break;
    case 'comment':
      // New comment
      break;
  }
}

export async function handleYouTubeWebhook(data) {
  logger.info('YouTube webhook received:', data);
  
  const { kind, eventType, resource } = data;
  
  switch (eventType) {
    case 'video.uploaded':
      // New video uploaded
      break;
    case 'channel.updated':
      // Channel updated
      break;
    case 'subscription.created':
      // New subscriber
      break;
  }
}

// Verify webhook signatures
export async function verifyWebhookSignature(payload, signature, secret) {
  // Implement platform-specific signature verification
  // This is a placeholder - actual implementation depends on platform
  
  if (!signature) {
    return false;
  }
  
  // For Meta (Instagram/Facebook)
  // const expectedSignature = crypto
  //   .createHmac('sha256', secret)
  //   .update(payload)
  //   .digest('hex');
  
  // return crypto.timingSafeEqual(
  //   Buffer.from(signature),
  //   Buffer.from(expectedSignature)
  // );
  
  return true; // Placeholder
}

// Register webhooks with platforms
export async function registerWebhooks(accountId, platform, accessToken) {
  const webhookUrl = `${process.env.API_BASE_URL}/api/webhooks/${platform}`;
  
  try {
    switch (platform) {
      case 'instagram':
      case 'facebook':
        await registerMetaWebhook(accountId, accessToken, webhookUrl);
        break;
      case 'twitter':
        await registerTwitterWebhook(accessToken, webhookUrl);
        break;
      case 'linkedin':
        await registerLinkedInWebhook(accountId, accessToken, webhookUrl);
        break;
    }
    
    logger.info(`Registered webhooks for ${platform} account ${accountId}`);
  } catch (error) {
    logger.error(`Failed to register webhooks for ${platform}:`, error);
    throw error;
  }
}

async function registerMetaWebhook(accountId, accessToken, webhookUrl) {
  // Register with Meta
  await axios.post(
    `https://graph.facebook.com/v18.0/${accountId}/subscribed_apps`,
    {
      subscribed_fields: 'messages,comments,insights',
      access_token: accessToken
    }
  );
}

async function registerTwitterWebhook(accessToken, webhookUrl) {
  // Register with Twitter
  // Twitter uses a different webhook registration process
  logger.info(`Would register Twitter webhook at ${webhookUrl}`);
}

async function registerLinkedInWebhook(accountId, accessToken, webhookUrl) {
  // Register with LinkedIn
  logger.info(`Would register LinkedIn webhook at ${webhookUrl}`);
}

// Process incoming webhook data
export async function processWebhook(platform, data, headers = {}) {
  logger.info(`Processing ${platform} webhook`);
  
  switch (platform) {
    case 'instagram':
    case 'facebook':
      await handleInstagramWebhook(data, headers['x-hub-signature']);
      break;
    case 'twitter':
      await handleTwitterWebhook(data, data.tweet_create_events);
      break;
    case 'linkedin':
      await handleLinkedInWebhook(data);
      break;
    case 'tiktok':
      await handleTikTokWebhook(data);
      break;
    case 'youtube':
      await handleYouTubeWebhook(data);
      break;
    default:
      logger.warn(`Unknown platform webhook: ${platform}`);
  }
}

export default {
  handleInstagramWebhook,
  handleTwitterWebhook,
  handleLinkedInWebhook,
  handleTikTokWebhook,
  handleYouTubeWebhook,
  verifyWebhookSignature,
  registerWebhooks,
  processWebhook
};
