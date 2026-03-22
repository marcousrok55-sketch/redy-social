import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi, postsApi } from '../services/api';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X,
  GripVertical
} from 'lucide-react';
import clsx from 'clsx';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📷', color: 'bg-pink-500' },
  { id: 'facebook', label: 'Facebook', emoji: '📘', color: 'bg-blue-500' },
  { id: 'twitter', label: 'Twitter', emoji: '🐦', color: 'bg-sky-400' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼', color: 'bg-blue-600' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', color: 'bg-black' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️', color: 'bg-red-500' },
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const queryClient = useQueryClient();

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: () => calendarApi.getEvents({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }).then(res => res.data)
  });

  const createPostMutation = useMutation({
    mutationFn: (data: any) => postsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowNewPost(false);
      setNewPostContent('');
      setSelectedPlatforms([]);
    }
  });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Pad days to start from Sunday
  const startDay = startDate.getDay();
  const paddedDays = [...Array(startDay).fill(null), ...days];

  const getPostsForDay = (date: Date) => {
    if (!calendarData?.posts) return [];
    const dateKey = format(date, 'yyyy-MM-dd');
    return calendarData.posts.filter((post: any) => {
      if (!post.scheduled_at) return false;
      return format(new Date(post.scheduled_at), 'yyyy-MM-dd') === dateKey;
    });
  };

  const handleCreatePost = () => {
    if (!newPostContent || selectedPlatforms.length === 0) return;
    
    selectedPlatforms.forEach(platform => {
      createPostMutation.mutate({
        platform,
        content: newPostContent,
        scheduledAt: selectedDate ? selectedDate.toISOString() : undefined
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-text-secondary">Plan and schedule your content</p>
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
      <div className="flex items-center gap-2 flex-wrap">
        {PLATFORMS.map(platform => (
          <button
            key={platform.id}
            className={clsx(
              'px-3 py-1.5 rounded-full text-sm transition-colors',
              selectedPlatforms.includes(platform.id)
                ? 'bg-primary text-white'
                : 'bg-surface text-text-secondary hover:text-white'
            )}
            onClick={() => setSelectedPlatforms(
              selectedPlatforms.includes(platform.id)
                ? selectedPlatforms.filter(p => p !== platform.id)
                : [...selectedPlatforms, platform.id]
            )}
          >
            {platform.emoji} {platform.label}
          </button>
        ))}
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-surface-light"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 rounded-lg bg-surface-light hover:bg-slate-600 text-sm"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-surface-light"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card p-0 overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-7 border-b border-surface-light">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-text-secondary text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {paddedDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="min-h-[120px] bg-background/50" />;
            }

            const posts = getPostsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const filteredPosts = selectedPlatforms.length > 0
              ? posts.filter((p: any) => selectedPlatforms.includes(p.platform))
              : posts;

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={clsx(
                  'min-h-[120px] p-2 border-b border-r border-surface-light cursor-pointer transition-colors',
                  !isSameMonth(day, currentDate) && 'bg-background/30 text-text-secondary',
                  isSelected && 'bg-primary/10',
                  isToday && 'bg-primary/5'
                )}
              >
                <div className={clsx(
                  'text-sm font-medium mb-1',
                  isToday && 'w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {filteredPosts.slice(0, 3).map((post: any) => {
                    const platform = PLATFORMS.find(p => p.id === post.platform);
                    return (
                      <div
                        key={post.id}
                        className={clsx(
                          'text-xs p-1 rounded truncate',
                          platform?.color || 'bg-surface-light',
                          'text-white'
                        )}
                        title={post.content}
                      >
                        {platform?.emoji} {post.content?.slice(0, 20)}...
                      </div>
                    );
                  })}
                  {filteredPosts.length > 3 && (
                    <div className="text-xs text-text-secondary">
                      +{filteredPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Post</h3>
              <button onClick={() => setShowNewPost(false)} className="text-text-secondary hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Platform selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(platform => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setSelectedPlatforms(
                        selectedPlatforms.includes(platform.id)
                          ? selectedPlatforms.filter(p => p !== platform.id)
                          : [...selectedPlatforms, platform.id]
                      )}
                      className={clsx(
                        'px-3 py-2 rounded-lg border transition-colors',
                        selectedPlatforms.includes(platform.id)
                          ? 'border-primary bg-primary/20 text-white'
                          : 'border-surface-light text-text-secondary hover:border-primary'
                      )}
                    >
                      {platform.emoji} {platform.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="input w-full h-32 resize-none"
                  placeholder="What do you want to share?"
                />
                <p className="text-xs text-text-secondary mt-1">
                  {newPostContent.length} characters
                </p>
              </div>

              {/* Schedule */}
              {selectedDate && (
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm">
                    Scheduled for: <span className="text-primary">{format(selectedDate, 'PPP')}</span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewPost(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent || selectedPlatforms.length === 0 || createPostMutation.isPending}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {createPostMutation.isPending ? 'Creating...' : 'Schedule Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
