import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import { emitToWorkspace } from './socketService.js';

// Notification types
const NOTIFICATION_TYPES = {
  POST_PUBLISHED: 'post_published',
  POST_FAILED: 'post_failed',
  POST_SCHEDULED: 'post_scheduled',
  NEW_COMMENT: 'new_comment',
  NEW_MESSAGE: 'new_message',
  MENTION: 'mention',
  FOLLOWER_MILESTONE: 'follower_milestone',
  ANALYTICS_ALERT: 'analytics_alert',
  TEAM_INVITE: 'team_invite',
  BILLING: 'billing',
  SYSTEM: 'system'
};

// Create notification
export async function createNotification(workspaceId, userId, type, title, message, data = {}) {
  try {
    const result = await query(
      `INSERT INTO notifications (workspace_id, user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [workspaceId, userId, type, title, message, JSON.stringify(data)]
    );

    const notification = result.rows[0];

    // Emit real-time notification
    if (userId) {
      emitToUser(userId, 'notification:new', notification);
    }

    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error);
    throw error;
  }
}

// Get notifications for user
export async function getNotifications(workspaceId, userId, options = {}) {
  const { limit = 50, offset = 0, unreadOnly = false } = options;

  let sql = `
    SELECT * FROM notifications 
    WHERE workspace_id = $1 
  `;
  const params = [workspaceId];

  if (userId) {
    sql += ` AND user_id = $2`;
    params.push(userId);
  }

  if (unreadOnly) {
    sql += ` AND is_read = false`;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
}

// Mark notification as read
export async function markAsRead(notificationId, userId) {
  const result = await query(
    `UPDATE notifications 
     SET is_read = true, read_at = NOW() 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [notificationId, userId]
  );

  return result.rows[0];
}

// Mark all as read
export async function markAllAsRead(workspaceId, userId) {
  await query(
    `UPDATE notifications 
     SET is_read = true, read_at = NOW() 
     WHERE workspace_id = $1 AND user_id = $2 AND is_read = false`,
    [workspaceId, userId]
  );
}

// Get unread count
export async function getUnreadCount(workspaceId, userId) {
  const result = await query(
    `SELECT COUNT(*) as count FROM notifications 
     WHERE workspace_id = $1 AND user_id = $2 AND is_read = false`,
    [workspaceId, userId]
  );

  return parseInt(result.rows[0].count);
}

// Delete notification
export async function deleteNotification(notificationId, userId) {
  await query(
    `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
}

// Notification helpers for common events
export async function notifyPostPublished(workspaceId, userId, post) {
  return createNotification(
    workspaceId,
    userId,
    NOTIFICATION_TYPES.POST_PUBLISHED,
    'Post Published! ✅',
    `Your post has been published to ${post.platform}`,
    { postId: post.id, platform: post.platform }
  );
}

export async function notifyPostFailed(workspaceId, userId, post, error) {
  return createNotification(
    workspaceId,
    userId,
    NOTIFICATION_TYPES.POST_FAILED,
    'Post Failed ❌',
    `Failed to publish to ${post.platform}: ${error}`,
    { postId: post.id, platform: post.platform, error }
  );
}

export async function notifyNewComment(workspaceId, userId, comment) {
  return createNotification(
    workspaceId,
    userId,
    NOTIFICATION_TYPES.NEW_COMMENT,
    'New Comment 💬',
    `New comment on your ${comment.platform} post`,
    { commentId: comment.id, platform: comment.platform }
  );
}

export async function notifyNewMessage(workspaceId, userId, message) {
  return createNotification(
    workspaceId,
    userId,
    NOTIFICATION_TYPES.NEW_MESSAGE,
    'New Message 💭',
    `New message from ${message.fromUser}`,
    { messageId: message.id, platform: message.platform }
  );
}

export async function notifyTeamInvite(workspaceId, invitedUserId, invitedBy, workspaceName) {
  return createNotification(
    workspaceId,
    invitedUserId,
    NOTIFICATION_TYPES.TEAM_INVITE,
    'Team Invitation 👥',
    `You've been invited to join ${workspaceName} by ${invitedBy.name}`,
    { workspaceId, workspaceName, invitedBy: invitedBy.id }
  );
}

export async function notifyFollowerMilestone(workspaceId, userId, platform, count) {
  return createNotification(
    workspaceId,
    userId,
    NOTIFICATION_TYPES.FOLLOWER_MILESTONE,
    `🎉 ${count} ${platform} Followers!`,
    `Congratulations! You've reached ${count} followers on ${platform}`,
    { platform, count }
  );
}

export async function notifyBilling(workspaceId, userId, type, message) {
  return createNotification(
    workspaceId,
    userId,
    NOTIFICATION_TYPES.BILLING,
    'Billing 💳',
    message,
    { type }
  );
}

export default {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  notifyPostPublished,
  notifyPostFailed,
  notifyNewComment,
  notifyNewMessage,
  notifyTeamInvite,
  notifyFollowerMilestone,
  notifyBilling,
  NOTIFICATION_TYPES
};
