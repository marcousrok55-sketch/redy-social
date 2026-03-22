import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi, accountsApi } from '../services/api';
import { format } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Send,
  MoreVertical,
  Image,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import clsx from 'clsx';

const STATUS_COLORS = {
  draft: 'bg-gray-500',
  scheduled: 'bg-yellow-500',
  published: 'bg-green-500',
  failed: 'bg-red-500'
};

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📷' },
  { id: 'facebook', label: 'Facebook', emoji: '📘' },
  { id: 'twitter', label: 'Twitter', emoji: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️' },
];

export default function Posts() {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: postsData, isLoading } = useQuery({
    queryKey: ['posts', platformFilter, statusFilter],
    queryFn: () => postsApi.getAll({
      platform: platformFilter || undefined,
      status: statusFilter || undefined,
      limit: 50
    }).then(res => res.data)
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll().then(res => res.data)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => postsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => postsApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
  });

  const [newPost, setNewPost] = useState({
    platform: 'instagram',
    content: '',
    accountId: '',
    scheduledAt: ''
  });

  const handleCreatePost = async () => {
    try {
      await postsApi.create({
        platform: newPost.platform,
        content: newPost.content,
        accountId: newPost.accountId || undefined,
        scheduledAt: newPost.scheduledAt || undefined
      });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowNewPost(false);
      setNewPost({ platform: 'instagram', content: '', accountId: '', scheduledAt: '' });
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePublishNow = (id: string) => {
    publishMutation.mutate(id);
  };

  const filteredPosts = postsData?.posts?.filter((post: any) => {
    if (search && !post.content?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-text-secondary">Manage all your social media posts</p>
        </div>
        <button 
          onClick={() => setShowNewPost(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          New Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-10"
          />
        </div>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="input"
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map(p => (
            <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Posts List */}
      <div className="card p-0">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No posts found</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-light">
            {filteredPosts.map((post: any) => (
              <div key={post.id} className="p-4 hover:bg-surface-light/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Platform Icon */}
                  <div className="text-2xl">
                    {PLATFORMS.find(p => p.id === post.platform)?.emoji || '📱'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('px-2 py-0.5 rounded text-xs', STATUS_COLORS[post.status as keyof typeof STATUS_COLORS])}>
                        {post.status}
                      </span>
                      <span className="text-text-secondary text-sm capitalize">{post.platform}</span>
                      {post.post_type && (
                        <span className="text-text-secondary text-xs">• {post.post_type}</span>
                      )}
                    </div>
                    <p className="text-sm line-clamp-2">{post.content || 'No content'}</p>
                    
                    {/* Media */}
                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {JSON.parse(post.media_urls).slice(0, 3).map((url: string, i: number) => (
                          <div key={i} className="w-16 h-16 rounded bg-surface-light overflow-hidden">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                      {post.scheduled_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {format(new Date(post.scheduled_at), 'PPp')}
                        </span>
                      )}
                      {post.published_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle size={12} />
                          Published {format(new Date(post.published_at), 'PPp')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {post.status === 'draft' && (
                      <button
                        onClick={() => handlePublishNow(post.id)}
                        className="p-2 rounded-lg hover:bg-surface-light text-green-400"
                        title="Publish now"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingPost(post)}
                      className="p-2 rounded-lg hover:bg-surface-light text-text-secondary"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 rounded-lg hover:bg-surface-light text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Post</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select
                  value={newPost.platform}
                  onChange={(e) => setNewPost({ ...newPost, platform: e.target.value })}
                  className="input w-full"
                >
                  {PLATFORMS.map(p => (
                    <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="input w-full h-32 resize-none"
                  placeholder="What do you want to share?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={newPost.scheduledAt}
                  onChange={(e) => setNewPost({ ...newPost, scheduledAt: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowNewPost(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleCreatePost} className="btn-primary flex-1">
                  Create Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
