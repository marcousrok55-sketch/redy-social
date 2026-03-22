import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility to merge tailwind classes
export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Format number with abbreviation (1k, 1M, etc.)
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

// Format date
export function formatDate(date: string | Date, format: string = 'PP'): string {
  // Using date-fns format
  return format;
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  
  return past.toLocaleDateString();
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

// Get platform color
export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    instagram: 'bg-pink-500',
    facebook: 'bg-blue-600',
    twitter: 'bg-sky-400',
    linkedin: 'bg-blue-700',
    tiktok: 'bg-black',
    youtube: 'bg-red-500'
  };
  return colors[platform] || 'bg-gray-500';
}

// Get platform emoji
export function getPlatformEmoji(platform: string): string {
  const emojis: Record<string, string> = {
    instagram: '📷',
    facebook: '📘',
    twitter: '🐦',
    linkedin: '💼',
    tiktok: '🎵',
    youtube: '▶️'
  };
  return emojis[platform] || '📱';
}

// Get status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-500',
    scheduled: 'bg-yellow-500',
    published: 'bg-green-500',
    failed: 'bg-red-500',
    pending: 'bg-orange-500',
    active: 'bg-green-500',
    inactive: 'bg-gray-500'
  };
  return colors[status] || 'bg-gray-500';
}

// Calculate engagement rate
export function calculateEngagement(likes: number, comments: number, shares: number, followers: number): number {
  if (followers === 0) return 0;
  return ((likes + comments + shares) / followers) * 100;
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Parse media URLs from JSON string
export function parseMediaUrls(mediaUrls: string | string[]): string[] {
  if (Array.isArray(mediaUrls)) return mediaUrls;
  try {
    return JSON.parse(mediaUrls);
  } catch {
    return [];
  }
}

// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Extract domain from URL
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Slugify text
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
