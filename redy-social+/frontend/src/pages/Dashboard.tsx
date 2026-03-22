import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsApi, accountsApi, postsApi } from '../services/api';
import { 
  Users, 
  TrendingUp, 
  FileText, 
  DollarSign,
  ArrowUpRight,
  Plus,
  BarChart3
} from 'lucide-react';
import Chart from 'react-apexcharts';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.getOverview().then(res => res.data)
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.getAll().then(res => res.data)
  });

  const { data: upcomingPosts } = useQuery({
    queryKey: ['posts', 'upcoming'],
    queryFn: () => postsApi.getAll({ status: 'scheduled', limit: 5 }).then(res => res.data)
  });

  const stats = [
    { 
      label: 'Total Followers', 
      value: analyticsData?.totals?.followers?.toLocaleString() || '0',
      change: '+12%',
      icon: Users,
      color: 'text-blue-400'
    },
    { 
      label: 'Engagement Rate', 
      value: analyticsData?.totals?.engagement?.toFixed(1) || '0%',
      change: '+5%',
      icon: TrendingUp,
      color: 'text-green-400'
    },
    { 
      label: 'Posts This Month', 
      value: analyticsData?.totals?.posts || '0',
      change: '+8%',
      icon: FileText,
      color: 'text-purple-400'
    },
    { 
      label: 'Revenue', 
      value: '$0',
      change: '+0%',
      icon: DollarSign,
      color: 'text-yellow-400'
    }
  ];

  // Chart configuration
  const chartOptions = {
    chart: {
      type: 'area',
      height: 350,
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true }
    },
    theme: { mode: 'dark' },
    colors: ['#6366F1'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 100]
      }
    },
    stroke: { curve: 'smooth', width: 2 },
    grid: {
      borderColor: '#334155',
      strokeDashArray: 4
    },
    xaxis: {
      categories: analyticsData?.byDate ? Object.keys(analyticsData.byDate).slice(-7) : [],
      labels: { style: { colors: '#94A3B8' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: '#94A3B8' } }
    },
    legend: { show: false },
    tooltip: { theme: 'dark' }
  };

  const chartSeries = [{
    name: 'Followers',
    data: analyticsData?.byDate ? Object.values(analyticsData.byDate).slice(-7).map((d: any) => d.followers) : []
  }];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-text-secondary">Here's what's happening with your social accounts.</p>
        </div>
        <Link to="/posts/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Post
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-surface-light ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="flex items-center text-green-400 text-sm">
                <ArrowUpRight size={14} className="mr-1" />
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-text-secondary text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Chart & Upcoming Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Followers Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Followers Growth</h2>
            <Link to="/analytics" className="text-primary text-sm hover:underline">
              View All
            </Link>
          </div>
          <Chart 
            options={chartOptions} 
            series={chartSeries} 
            type="area" 
            height={280} 
          />
        </div>

        {/* Upcoming Posts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Upcoming Posts</h2>
            <Link to="/posts" className="text-primary text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingPosts?.posts?.length > 0 ? (
              upcomingPosts.posts.map((post: any) => (
                <div key={post.id} className="p-3 rounded-lg bg-background border border-surface-light">
                  <p className="text-sm truncate">{post.content || 'No content'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-secondary capitalize">{post.platform}</span>
                    <span className="text-xs text-text-secondary">
                      {post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString() : 'Draft'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-text-secondary text-sm text-center py-4">No upcoming posts</p>
            )}
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Connected Accounts</h2>
          <Link to="/settings" className="btn-secondary text-sm">
            Manage Accounts
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {accountsData?.accounts?.length > 0 ? (
            accountsData.accounts.map((account: any) => (
              <div key={account.id} className="p-4 rounded-lg bg-background border border-surface-light text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-surface-light flex items-center justify-center text-2xl">
                  {account.platform === 'instagram' && '📷'}
                  {account.platform === 'facebook' && '📘'}
                  {account.platform === 'twitter' && '🐦'}
                  {account.platform === 'linkedin' && '💼'}
                  {account.platform === 'tiktok' && '🎵'}
                  {account.platform === 'youtube' && '▶️'}
                </div>
                <p className="text-sm font-medium truncate">{account.platform_username}</p>
                <p className="text-xs text-text-secondary capitalize">{account.platform}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center">
              <BarChart3 className="mx-auto mb-2 text-text-secondary" size={40} />
              <p className="text-text-secondary">No accounts connected yet</p>
              <Link to="/settings" className="text-primary text-sm hover:underline">
                Connect your first account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
