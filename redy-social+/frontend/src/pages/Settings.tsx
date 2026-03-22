import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { accountsApi, billingApi } from '../services/api';
import { 
  User, 
  Users, 
  Link as LinkIcon, 
  CreditCard,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  Loader
} from 'lucide-react';
import clsx from 'clsx';

const PLATFORMS = [
  { id: 'meta', label: 'Facebook/Instagram', emoji: '📘', color: 'bg-blue-600' },
  { id: 'twitter', label: 'Twitter/X', emoji: '🐦', color: 'bg-sky-400' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼', color: 'bg-blue-700' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', color: 'bg-black' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️', color: 'bg-red-500' },
];

const PLANS = [
  { 
    id: 'free', 
    label: 'Free', 
    price: 0, 
    features: ['2 Social Accounts', '10 Scheduled Posts', 'Basic Analytics', 'Community Support']
  },
  { 
    id: 'pro', 
    label: 'Pro', 
    price: 29, 
    features: ['5 Social Accounts', 'Unlimited Posts', 'AI Content Assistant', 'Advanced Analytics', 'Priority Support'],
    popular: true
  },
  { 
    id: 'agency', 
    label: 'Agency', 
    price: 99, 
    features: ['Unlimited Accounts', 'White-label', 'Team Members', 'API Access', 'Dedicated Support']
  },
];

export default function Settings() {
  const { user, workspace } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll().then(res => res.data)
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription().then(res => res.data)
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => accountsApi.disconnect(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounts'] })
  });

  const connectMutation = useMutation({
    mutationFn: (platform: string) => accountsApi.connect(platform),
    onSuccess: (data) => {
      // Redirect to OAuth URL
      if (data.data?.authUrl) {
        window.location.href = data.data.authUrl;
      }
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: (plan: string) => billingApi.createCheckout(plan),
    onSuccess: (data) => {
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'accounts', label: 'Connected Accounts', icon: LinkIcon },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-text-secondary">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-light pb-2">
        {tabs.map(tab => (
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
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card max-w-2xl">
          <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-text-secondary text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  defaultValue={user?.name}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  defaultValue={user?.email}
                  className="input w-full"
                  disabled
                />
              </div>
            </div>

            <button className="btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Connected Accounts */}
          <div className="card max-w-2xl">
            <h2 className="text-lg font-semibold mb-6">Connected Accounts</h2>
            
            {accountsLoading ? (
              <div className="flex justify-center py-8">
                <Loader className="animate-spin" size={24} />
              </div>
            ) : accountsData?.accounts?.length > 0 ? (
              <div className="space-y-3">
                {accountsData.accounts.map((account: any) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-background border border-surface-light"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {PLATFORMS.find(p => p.id === account.platform)?.emoji}
                      </div>
                      <div>
                        <p className="font-medium">{account.platform_username}</p>
                        <p className="text-sm text-text-secondary capitalize">{account.platform}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.is_active && (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <Check size={14} /> Connected
                        </span>
                      )}
                      <button
                        onClick={() => disconnectMutation.mutate(account.id)}
                        className="p-2 rounded-lg hover:bg-surface-light text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-center py-8">No accounts connected yet</p>
            )}
          </div>

          {/* Connect New Account */}
          <div className="card max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Connect New Account</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PLATFORMS.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => connectMutation.mutate(platform.id)}
                  disabled={connectMutation.isPending}
                  className="flex items-center gap-3 p-4 rounded-lg border border-surface-light hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <span className="text-2xl">{platform.emoji}</span>
                  <span className="text-sm">{platform.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="card max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold capitalize">{subscriptionData?.plan || 'Free'}</p>
                  <p className="text-text-secondary text-sm">
                    {subscriptionData?.subscription?.status === 'active' 
                      ? `Renewed ${new Date(subscriptionData.subscription.current_period_end).toLocaleDateString()}`
                      : 'Free forever'
                    }
                  </p>
                </div>
                {subscriptionData?.plan !== 'free' && (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-6">Available Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  className={clsx(
                    'p-6 rounded-xl border relative',
                    plan.popular 
                      ? 'border-primary bg-primary/5' 
                      : 'border-surface-light bg-surface'
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs">
                      Popular
                    </span>
                  )}
                  <h3 className="text-xl font-semibold">{plan.label}</h3>
                  <p className="text-3xl font-bold mt-2">
                    ${plan.price}
                    <span className="text-text-secondary text-sm font-normal">/month</span>
                  </p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                        <Check size={14} className="text-green-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => checkoutMutation.mutate(plan.id)}
                    disabled={subscriptionData?.plan === plan.id || checkoutMutation.isPending}
                    className={clsx(
                      'w-full mt-6 py-2 rounded-lg font-medium transition-colors',
                      subscriptionData?.plan === plan.id
                        ? 'bg-surface-light text-text-secondary cursor-not-allowed'
                        : plan.popular
                          ? 'btn-primary'
                          : 'btn-secondary'
                    )}
                  >
                    {subscriptionData?.plan === plan.id 
                      ? 'Current Plan' 
                      : checkoutMutation.isPending 
                        ? 'Loading...' 
                        : plan.price === 0 ? 'Downgrade' : 'Upgrade'
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
