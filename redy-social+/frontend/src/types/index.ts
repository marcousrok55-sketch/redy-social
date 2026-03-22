export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface Workspace {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'agency';
}

export interface SocialAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';
  platformUsername: string;
  platformUserId: string;
  profileData?: {
    name?: string;
    picture?: string;
    followers?: number;
  };
  isActive: boolean;
  connectedAt: string;
}

export interface Post {
  id: string;
  accountId?: string;
  content: string;
  mediaUrls: string[];
  platform: string;
  postType: 'post' | 'story' | 'reel' | 'thread';
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    engagement?: number;
  };
  accountPlatform?: string;
  accountUsername?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InboxMessage {
  id: string;
  accountId: string;
  platform: string;
  type: 'comment' | 'message' | 'mention';
  content: string;
  fromUser: {
    id: string;
    name: string;
    picture?: string;
  };
  isRead: boolean;
  isStarred: boolean;
  isPending: boolean;
  repliedAt?: string;
  createdAt: string;
}

export interface Analytics {
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
  posts: number;
}

export interface QuickReply {
  id: string;
  title: string;
  content: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}
