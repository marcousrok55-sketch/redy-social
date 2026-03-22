import axios from 'axios';
import logger from '../utils/logger.js';

// Base class for social platform integrations
class SocialPlatform {
  constructor(platform, config) {
    this.platform = platform;
    this.config = config;
  }

  async getAccessToken(refreshToken) {
    throw new Error('Method not implemented');
  }

  async getProfile(accessToken) {
    throw new Error('Method not implemented');
  }

  async post(accessToken, content, mediaUrls) {
    throw new Error('Method not implemented');
  }

  async getAnalytics(accessToken, startDate, endDate) {
    throw new Error('Method not implemented');
  }
}

// Instagram/Facebook Integration using Meta Graph API
class InstagramPlatform extends SocialPlatform {
  constructor(config) {
    super('instagram', config);
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async getAccessToken(refreshToken) {
    // Meta tokens don't use refresh token in the traditional way
    // They need to be extended using the oauth endpoint
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.config.appId,
          client_secret: this.config.appSecret,
          fb_exchange_token: refreshToken
        }
      });
      return response.data.access_token;
    } catch (error) {
      logger.error('Failed to refresh Instagram token:', error);
      throw error;
    }
  }

  async getProfile(accessToken) {
    try {
      // First get the user ID
      const userResponse = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id,name',
          access_token: accessToken
        }
      });

      // Then get Instagram business account
      const igResponse = await axios.get(`${this.baseUrl}/${userResponse.data.id}`, {
        params: {
          fields: 'instagram_business_account',
          access_token: accessToken
        }
      });

      if (!igResponse.data.instagram_business_account) {
        throw new Error('No Instagram business account found');
      }

      // Get Instagram account details
      const igAccountResponse = await axios.get(
        `${this.baseUrl}/${igResponse.data.instagram_business_account.id}`,
        {
          params: {
            fields: 'id,username,name,media_count,followers_count,follows_count',
            access_token: accessToken
          }
        }
      );

      return {
        platformUserId: igAccountResponse.data.id,
        platformUsername: igAccountResponse.data.username,
        name: igAccountResponse.data.name,
        followers: igAccountResponse.data.followers_count,
        following: igAccountResponse.data.follows_count,
        mediaCount: igAccountResponse.data.media_count
      };
    } catch (error) {
      logger.error('Failed to get Instagram profile:', error);
      throw error;
    }
  }

  async post(accessToken, content, mediaUrls, igAccountId) {
    try {
      // For posts with images, we need to first upload the image
      let mediaId = null;

      if (mediaUrls && mediaUrls.length > 0) {
        // Upload image to Instagram
        const imageResponse = await axios.post(
          `${this.baseUrl}/${igAccountId}/media`,
          {
            image_url: mediaUrls[0],
            caption: content,
            access_token: accessToken
          }
        );
        mediaId = imageResponse.data.id;

        // Publish the media
        const publishResponse = await axios.post(
          `${this.baseUrl}/${igAccountId}/media_publish`,
          {
            creation_id: mediaId,
            access_token: accessToken
          }
        );

        return { platformPostId: publishResponse.data.id };
      } else {
        // For text-only posts (carousel or single image)
        const response = await axios.post(
          `${this.baseUrl}/${igAccountId}/media`,
          {
            caption: content,
            access_token: accessToken
          }
        );

        // Publish
        const publishResponse = await axios.post(
          `${this.baseUrl}/${igAccountId}/media_publish`,
          {
            creation_id: response.data.id,
            access_token: accessToken
          }
        );

        return { platformPostId: publishResponse.data.id };
      }
    } catch (error) {
      logger.error('Failed to post to Instagram:', error);
      throw error;
    }
  }

  async getAnalytics(accessToken, igAccountId, startDate, endDate) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${igAccountId}/insights`,
        {
          params: {
            metric: 'follower_count,impressions,reach,engagement',
            access_token: accessToken
          }
        }
      );

      const metrics = {};
      for (const data of response.data.data) {
        metrics[data.name] = data.values[0]?.value || 0;
      }

      return metrics;
    } catch (error) {
      logger.error('Failed to get Instagram analytics:', error);
      throw error;
    }
  }
}

// Twitter/X Integration using Twitter API v2
class TwitterPlatform extends SocialPlatform {
  constructor(config) {
    super('twitter', config);
    this.baseUrl = 'https://api.twitter.com/2';
  }

  async getAccessToken(refreshToken) {
    try {
      const response = await axios.post(
        'https://api.twitter.com/2/oauth2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.config.apiKey,
          client_secret: this.config.apiSecret
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      return response.data.access_token;
    } catch (error) {
      logger.error('Failed to refresh Twitter token:', error);
      throw error;
    }
  }

  async getProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        params: {
          'user.fields': 'public_metrics,profile_image_url,description'
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const data = response.data.data;
      return {
        platformUserId: data.id,
        platformUsername: data.username,
        name: data.name,
        bio: data.description,
        followers: data.public_metrics.followers_count,
        following: data.public_metrics.following_count,
        tweetCount: data.public_metrics.tweet_count
      };
    } catch (error) {
      logger.error('Failed to get Twitter profile:', error);
      throw error;
    }
  }

  async post(accessToken, content, mediaUrls) {
    try {
      const tweetData = { text: content };

      if (mediaUrls && mediaUrls.length > 0) {
        // Upload media first
        const mediaIds = [];
        for (const mediaUrl of mediaUrls) {
          const mediaUploadResponse = await axios.post(
            'https://upload.twitter.com/1.1/media/upload.json',
            { media: mediaUrl },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            }
          );
          mediaIds.push(mediaUploadResponse.data.media_id_string);
        }
        tweetData['media'] = { media_ids: mediaIds };
      }

      const response = await axios.post(`${this.baseUrl}/tweets`, tweetData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return { platformPostId: response.data.data.id };
    } catch (error) {
      logger.error('Failed to post to Twitter:', error);
      throw error;
    }
  }

  async getAnalytics(accessToken, userId, startDate, endDate) {
    try {
      const response = await axios.get(`${this.baseUrl}/users/${userId}/tweets`, {
        params: {
          start_time: startDate,
          end_time: endDate,
          'tweet.fields': 'public_metrics'
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      let totalImpressions = 0;
      let totalLikes = 0;
      let totalRetweets = 0;
      let totalReplies = 0;

      for (const tweet of response.data.data || []) {
        const metrics = tweet.public_metrics;
        totalImpressions += metrics.impression_count || 0;
        totalLikes += metrics.like_count || 0;
        totalRetweets += metrics.retweet_count || 0;
        totalReplies += metrics.reply_count || 0;
      }

      return {
        impressions: totalImpressions,
        likes: totalLikes,
        retweets: totalRetweets,
        replies: totalReplies,
        engagement: totalLikes + totalRetweets + totalReplies
      };
    } catch (error) {
      logger.error('Failed to get Twitter analytics:', error);
      throw error;
    }
  }
}

// LinkedIn Integration
class LinkedInPlatform extends SocialPlatform {
  constructor(config) {
    super('linkedin', config);
    this.baseUrl = 'https://api.linkedin.com/v2';
  }

  async getProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const profileResponse = await axios.get(
        `${this.baseUrl}/people/${response.data.id}`,
        {
          params: {
            projection: '(id,firstName,lastName,headline,profilePicture)'
          },
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );

      return {
        platformUserId: profileResponse.data.id,
        platformUsername: `${profileResponse.data.firstName} ${profileResponse.data.lastName}`,
        name: profileResponse.data.headline
      };
    } catch (error) {
      logger.error('Failed to get LinkedIn profile:', error);
      throw error;
    }
  }

  async post(accessToken, content, mediaUrls) {
    try {
      const postData = {
        author: `urn:li:person:${accessToken}`, // This needs to be corrected with actual user URN
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: mediaUrls?.length > 0 ? 'IMAGE' : 'NONE',
            media: mediaUrls?.map(url => ({
              status: 'READY',
              media: url
            }))
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await axios.post(`${this.baseUrl}/ugcPosts`, postData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return { platformPostId: response.data.id };
    } catch (error) {
      logger.error('Failed to post to LinkedIn:', error);
      throw error;
    }
  }
}

// Factory function to get platform instance
export function getPlatformInstance(platform, config) {
  switch (platform) {
    case 'meta':
    case 'instagram':
    case 'facebook':
      return new InstagramPlatform(config);
    case 'twitter':
      return new TwitterPlatform(config);
    case 'linkedin':
      return new LinkedInPlatform(config);
    case 'tiktok':
      // TODO: Implement TikTok platform
      logger.warn('TikTok platform not yet implemented');
      return null;
    case 'youtube':
      // TODO: Implement YouTube platform
      logger.warn('YouTube platform not yet implemented');
      return null;
    default:
      logger.error(`Unknown platform: ${platform}`);
      return null;
  }
}

// Publish post to platform
export async function publishToPlatform(platform, accessToken, content, mediaUrls, options = {}) {
  const platformInstance = getPlatformInstance(platform, options.config);
  
  if (!platformInstance) {
    throw new Error(`Platform ${platform} not supported`);
  }

  return platformInstance.post(accessToken, content, mediaUrls);
}

// Get platform profile
export async function getPlatformProfile(platform, accessToken, options = {}) {
  const platformInstance = getPlatformInstance(platform, options.config);
  
  if (!platformInstance) {
    throw new Error(`Platform ${platform} not supported`);
  }

  return platformInstance.getProfile(accessToken);
}

// Get platform analytics
export async function getPlatformAnalytics(platform, accessToken, options = {}) {
  const platformInstance = getPlatformInstance(platform, options.config);
  
  if (!platformInstance) {
    throw new Error(`Platform ${platform} not supported`);
  }

  return platformInstance.getAnalytics(accessToken, options.startDate, options.endDate);
}

export default {
  getPlatformInstance,
  publishToPlatform,
  getPlatformProfile,
  getPlatformAnalytics
};
