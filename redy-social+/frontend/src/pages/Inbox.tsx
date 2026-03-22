import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inboxApi } from '../services/api';
import { format } from 'date-fns';
import { 
  Inbox, 
  Star, 
  CheckCircle, 
  Clock,
  Send,
  Search,
  Filter,
  MessageSquare
} from 'lucide-react';
import clsx from 'clsx';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📷' },
  { id: 'facebook', label: 'Facebook', emoji: '📘' },
  { id: 'twitter', label: 'Twitter', emoji: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
];

const TABS = [
  { id: 'all', label: 'All', icon: Inbox },
  { id: 'unread', label: 'Unread', icon: MessageSquare },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'pending', label: 'Pending', icon: Clock },
];

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['inbox', activeTab, platformFilter],
    queryFn: () => inboxApi.getMessages({
      isRead: activeTab === 'unread' ? false : undefined,
      isStarred: activeTab === 'starred' ? true : undefined,
      isPending: activeTab === 'pending' ? true : undefined,
      platform: platformFilter || undefined
    }).then(res => res.data)
  });

  const markReadMutation = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => inboxApi.markAsRead(id, isRead),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inbox'] })
  });

  const markStarredMutation = useMutation({
    mutationFn: ({ id, isStarred }: { id: string; isStarred: boolean }) => inboxApi.markAsStarred(id, isStarred),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inbox'] })
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => inboxApi.reply(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      setReplyContent('');
      setSelectedMessage(null);
    }
  });

  const handleMarkRead = (message: any) => {
    if (!message.is_read) {
      markReadMutation.mutate({ id: message.id, isRead: true });
    }
  };

  const handleMarkStarred = (message: any) => {
    markStarredMutation.mutate({ id: message.id, isStarred: !message.is_starred });
  };

  const handleReply = () => {
    if (!replyContent.trim() || !selectedMessage) return;
    replyMutation.mutate({ id: selectedMessage.id, content: replyContent });
  };

  const messages = messagesData?.messages || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-text-secondary">Manage messages and comments from all platforms</p>
        </div>
        
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-light pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-white hover:bg-surface-light'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === 'unread' && messagesData?.unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {messagesData.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
        {/* Messages List */}
        <div className="lg:col-span-1 card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="mx-auto mb-2 text-text-secondary" size={40} />
              <p className="text-text-secondary">No messages</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-light max-h-[600px] overflow-y-auto">
              {messages.map(message => (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelectedMessage(message);
                    handleMarkRead(message);
                  }}
                  className={clsx(
                    'p-4 cursor-pointer transition-colors',
                    selectedMessage?.id === message.id
                      ? 'bg-primary/20'
                      : 'hover:bg-surface-light',
                    !message.is_read && 'bg-surface-light/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {PLATFORMS.find(p => p.id === message.platform)?.emoji || '📱'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">
                          {message.from_user?.name || 'Unknown'}
                        </p>
                        <span className="text-xs text-text-secondary">
                          {format(new Date(message.created_at), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary truncate">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {message.is_starred && (
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        )}
                        {message.is_pending && (
                          <Clock size={12} className="text-yellow-400" />
                        )}
                        {message.replied_at && (
                          <CheckCircle size={12} className="text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 card">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              {/* Message header */}
              <div className="flex items-center justify-between pb-4 border-b border-surface-light">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {PLATFORMS.find(p => p.id === selectedMessage.platform)?.emoji}
                  </div>
                  <div>
                    <p className="font-medium">{selectedMessage.from_user?.name || 'Unknown'}</p>
                    <p className="text-sm text-text-secondary capitalize">{selectedMessage.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkStarred(selectedMessage)}
                    className={clsx(
                      'p-2 rounded-lg transition-colors',
                      selectedMessage.is_starred
                        ? 'bg-yellow-400/20 text-yellow-400'
                        : 'hover:bg-surface-light text-text-secondary'
                    )}
                  >
                    <Star size={18} className={selectedMessage.is_starred ? 'fill-yellow-400' : ''} />
                  </button>
                </div>
              </div>

              {/* Message content */}
              <div className="flex-1 py-4 overflow-y-auto">
                <div className="bg-background rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  <p className="text-xs text-text-secondary mt-4">
                    {format(new Date(selectedMessage.created_at), 'PPp')}
                  </p>
                </div>

                {/* Reply section */}
                <div className="mt-4">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="input w-full h-24 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleReply}
                      disabled={!replyContent.trim() || replyMutation.isPending}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send size={16} />
                      {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <MessageSquare size={48} className="mb-4" />
              <p>Select a message to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
