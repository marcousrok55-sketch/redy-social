import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformsApi } from '../services/api';
import { 
  Instagram, Facebook, Twitter, Linkedin, Youtube, 
  Music, Pin, Globe, MessageCircle, Settings,
  Check, X, RefreshCw, Plus, Trash2, ExternalLink, Webhook
} from 'lucide-react';
import clsx from 'clsx';

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook_page: Facebook,
  threads: MessageCircle,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Music,
  tiktok_beta: Music,
  tiktok_business: Music,
  youtube: Youtube,
  youtube_short: Youtube,
  pinterest: Pin,
  website: Globe,
  reddit: MessageCircle
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-500',
  facebook_page: 'from-blue-600 to-blue-700',
  threads: 'from-gray-700 to-gray-900',
  twitter: 'from-sky-400 to-sky-500',
  linkedin: 'from-blue-700 to-blue-800',
  tiktok: 'from-gray-800 to-black',
  tiktok_beta: 'from-gray-800 to-black',
  tiktok_business: 'from-cyan-400 to-teal-500',
  youtube: 'from-red-600 to-red-700',
  youtube_short: 'from-red-600 to-red-700',
  pinterest: 'from-red-500 to-pink-500',
  website: 'from-blue-500 to-indigo-600',
  reddit: 'from-orange-500 to-red-500'
};

export default function PlatformManager() {
  const [activeTab, setActiveTab] = useState<'platforms' | 'n8n' | 'websites'>('platforms');
  const queryClient = useQueryClient();

  const { data: platformsData, isLoading: platformsLoading } = useQuery({
    queryKey: ['platforms'],
    queryFn: () => platformsApi.getAll().then(res => res.data)
  });

  const { data: n8nData, isLoading: n8nLoading } = useQuery({
    queryKey: ['n8n-configs'],
    queryFn: () => platformsApi.getN8NConfigs().then(res => res.data)
  });

  const saveN8NMutation = useMutation({
    mutationFn: platformsApi.saveN8NConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['n8n-configs'] })
  });

  const testWebhookMutation = useMutation({
    mutationFn: platformsApi.testN8NWebhook,
  });

  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState({ webhookUrl: '', apiKey: '', enabled: false, events: [] as string[] });

  const handleSaveConfig = async (platformId: string) => {
    await saveN8NMutation.mutateAsync({ platformId, ...configForm });
    setEditingConfig(null);
    setConfigForm({ webhookUrl: '', apiKey: '', enabled: false, events: [] });
  };

  const handleTestWebhook = async (webhookUrl: string, apiKey: string) => {
    try {
      await testWebhookMutation.mutateAsync({ webhookUrl, apiKey, headers: {} });
      alert('Webhook test successful!');
    } catch (error: any) {
      alert(`Webhook test failed: ${error.message}`);
    }
  };

  const platforms = platformsData?.platforms || [];
  const n8nConfigs = n8nData?.configurations || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="text-primary" />
            Platform Manager
          </h1>
          <p className="text-text-secondary">Manage all social platforms and integrations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-light pb-2">
        {[
          { id: 'platforms', label: 'All Platforms', icon: Globe },
          { id: 'n8n', label: 'N8N Integrations', icon: Webhook },
          { id: 'websites', label: 'Website APIs', icon: Globe }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              activeTab === tab.id ? 'bg-primary text-white' : 'text-text-secondary hover:text-white hover:bg-surface-light'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Platforms Tab */}
      {activeTab === 'platforms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {platforms.map(platform => {
            const Icon = PLATFORM_ICONS[platform.id] || Globe;
            const colorClass = PLATFORM_COLORS[platform.id] || 'from-gray-500 to-gray-600';
            
            return (
              <div key={platform.id} className="card p-0 overflow-hidden">
                <div className={clsx('h-2 bg-gradient-to-r', colorClass)} />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={clsx('w-10 h-10 rounded-lg bg-gradient-to-r flex items-center justify-center text-white', colorClass)}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{platform.name}</h3>
                      <p className="text-xs text-text-secondary capitalize">{platform.category}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {platform.capabilities?.slice(0, 3).map(cap => (
                      <span key={cap} className="px-2 py-0.5 bg-surface-light rounded text-xs text-text-secondary">
                        {cap}
                      </span>
                    ))}
                  </div>
                  <button className="btn-secondary w-full text-sm">
                    Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* N8N Tab */}
      {activeTab === 'n8n' && (
        <div className="space-y-4">
          <div className="card bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-2">🎯 N8N Workflow Integration</h3>
            <p className="text-sm text-text-secondary">
              Connect N8N webhooks to trigger custom workflows when posts are published. 
              Each platform can have its own webhook URL for different automation scenarios.
            </p>
          </div>

          <div className="grid gap-4">
            {n8nConfigs.map(config => {
              const Icon = PLATFORM_ICONS[config.id] || Globe;
              const isEditing = editingConfig === config.id;

              return (
                <div key={config.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon size={24} className="text-text-secondary" />
                      <div>
                        <h3 className="font-semibold">{config.name}</h3>
                        <p className="text-xs text-text-secondary">
                          Events: {config.events?.join(', ') || 'None configured'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.enabled ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <Check size={14} /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-text-secondary text-sm">
                          <X size={14} /> Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-4 space-y-3">
                      <input
                        type="url"
                        placeholder="N8N Webhook URL"
                        value={configForm.webhookUrl}
                        onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                        className="input w-full"
                      />
                      <input
                        type="password"
                        placeholder="API Key (optional)"
                        value={configForm.apiKey}
                        onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                        className="input w-full"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveConfig(config.id)}
                          disabled={!configForm.webhookUrl || saveN8NMutation.isPending}
                          className="btn-primary flex-1"
                        >
                          {saveN8NMutation.isPending ? 'Saving...' : 'Save'}
                        </button>
                        {configForm.webhookUrl && (
                          <button
                            onClick={() => handleTestWebhook(configForm.webhookUrl, configForm.apiKey)}
                            className="btn-secondary"
                          >
                            Test
                          </button>
                        )}
                        <button onClick={() => setEditingConfig(null)} className="btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingConfig(config.id);
                          setConfigForm({
                            webhookUrl: config.webhookUrl || '',
                            apiKey: config.apiKey || '',
                            enabled: config.enabled || false,
                            events: config.events || []
                          });
                        }}
                        className="btn-secondary flex-1"
                      >
                        Configure
                      </button>
                      {config.webhookUrl && (
                        <a
                          href={config.webhookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Websites Tab */}
      {activeTab === 'websites' && (
        <div className="space-y-4">
          <div className="card bg-primary/5 border-primary/20">
            <h3 className="font-semibold mb-2">🌐 Website/Blog API Integration</h3>
            <p className="text-sm text-text-secondary">
              Connect your website or blog via API to publish posts directly. 
              Supports WordPress, Ghost, Webflow, Strapi, and custom REST APIs.
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Connected Websites</h3>
              <button className="btn-primary flex items-center gap-2">
                <Plus size={16} /> Add Website
              </button>
            </div>

            <div className="text-center py-8 text-text-secondary">
              <Globe size={48} className="mx-auto mb-4 opacity-50" />
              <p>No websites connected yet</p>
              <p className="text-sm">Connect your first website to start publishing</p>
            </div>
          </div>

          {/* Website Types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'WordPress', icon: '📝', desc: 'REST API', color: 'bg-blue-500' },
              { name: 'Ghost', icon: '👻', desc: 'Admin API', color: 'bg-green-500' },
              { name: 'Webflow', icon: '🌊', desc: 'API', color: 'bg-cyan-500' },
              { name: 'Strapi', icon: '📦', desc: 'REST API', color: 'bg-purple-500' },
              { name: 'Custom', icon: '⚙️', desc: 'REST/GraphQL', color: 'bg-gray-500' },
              { name: 'Webhook', icon: '🔗', desc: 'Outgoing', color: 'bg-orange-500' }
            ].map(site => (
              <div key={site.name} className="card text-center p-4">
                <div className={clsx('w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center text-2xl', site.color)}>
                  {site.icon}
                </div>
                <h4 className="font-semibold">{site.name}</h4>
                <p className="text-xs text-text-secondary">{site.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
