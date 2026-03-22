import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import Chart from 'react-apexcharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📷' },
  { id: 'facebook', label: 'Facebook', emoji: '📘' },
  { id: 'twitter', label: 'Twitter', emoji: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { id: 'youtube', label: 'YouTube', emoji: '▶️' },
];

const DATE_RANGES = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
];

export default function Analytics() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [dateRange, setDateRange] = useState(30);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', 'overview', dateRange],
    queryFn: () => analyticsApi.getOverview({
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString()
    }).then(res => res.data)
  });

  const { data: platformData } = useQuery({
    queryKey: ['analytics', selectedPlatform, dateRange],
    queryFn: () => selectedPlatform 
      ? analyticsApi.getPlatform(selectedPlatform, {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }).then(res => res.data)
      : Promise.resolve(null),
    enabled: !!selectedPlatform
  });

  const stats = [
    { 
      label: 'Total Followers', 
      value: analyticsData?.totals?.followers?.toLocaleString() || '0',
      change: 12.5,
      icon: Users,
      color: 'text-blue-400'
    },
    { 
      label: 'Engagement Rate', 
      value: (analyticsData?.totals?.engagement || 0).toFixed(2) + '%',
      change: 5.2,
      icon: Heart,
      color: 'text-pink-400'
    },
    { 
      label: 'Total Reach', 
      value: (analyticsData?.totals?.reach || 0).toLocaleString(),
      change: 8.3,
      icon: Eye,
      color: 'text-purple-400'
    },
    { 
      label: 'Impressions', 
      value: (analyticsData?.totals?.impressions || 0).toLocaleString(),
      change: -2.1,
      icon: TrendingUp,
      color: 'text-green-400'
    }
  ];

  // Followers chart
  const followersChartOptions = {
    chart: {
      type: 'area',
      height: 300,
      background: 'transparent',
      toolbar: { show: false }
    },
    theme: { mode: 'dark' },
    colors: ['#6366F1'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0,
        stops: [0, 100]
      }
    },
    stroke: { curve: 'smooth', width: 2 },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    xaxis: {
      categories: analyticsData?.byDate ? Object.keys(analyticsData.byDate) : [],
      labels: { style: { colors: '#94A3B8' } }
    },
    yaxis: { labels: { style: { colors: '#94A3B8' } } },
    legend: { show: false },
    tooltip: { theme: 'dark' }
  };

  const followersChartSeries = [{
    name: 'Followers',
    data: analyticsData?.byDate ? Object.values(analyticsData.byDate).map((d: any) => d.followers) : []
  }];

  // Engagement chart
  const engagementChartOptions = {
    chart: {
      type: 'bar',
      height: 300,
      background: 'transparent',
      toolbar: { show: false }
    },
    theme: { mode: 'dark' },
    colors: ['#10B981'],
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: '50%' }
    },
    grid: { borderColor: '#334155', strokeDashArray: 4 },
    xaxis: {
      categories: analyticsData?.byDate ? Object.keys(analyticsData.byDate) : [],
      labels: { style: { colors: '#94A3B8' } }
    },
    yaxis: { labels: { style: { colors: '#94A3B8' } } },
    legend: { show: false },
    tooltip: { theme: 'dark' }
  };

  const engagementChartSeries = [{
    name: 'Engagement',
    data: analyticsData?.byDate ? Object.values(analyticsData.byDate).map((d: any) => d.engagement) : []
  }];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-text-secondary">Track your social media performance</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Platform filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="input"
          >
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => (
              <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex rounded-lg bg-surface overflow-hidden border border-surface-light">
            {DATE_RANGES.map(range => (
              <button
                key={range.days}
                onClick={() => setDateRange(range.days)}
                className={`px-4 py-2 text-sm transition-colors ${
                  dateRange === range.days 
                    ? 'bg-primary text-white' 
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-surface-light ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`flex items-center text-sm ${stat.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change >= 0 ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                {Math.abs(stat.change)}%
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-text-secondary text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Followers Growth</h3>
          <Chart 
            options={followersChartOptions} 
            series={followersChartSeries} 
            type="area" 
            height={280} 
          />
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Engagement Over Time</h3>
          <Chart 
            options={engagementChartOptions} 
            series={engagementChartSeries} 
            type="bar" 
            height={280} 
          />
        </div>
      </div>

      {/* Top Posts */}
      <div className="card">
        <h3 className="font-semibold mb-4">Top Performing Posts</h3>
        {analyticsData?.topPosts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-text-secondary text-sm border-b border-surface-light">
                  <th className="pb-3 font-medium">Post</th>
                  <th className="pb-3 font-medium">Platform</th>
                  <th className="pb-3 font-medium">Likes</th>
                  <th className="pb-3 font-medium">Comments</th>
                  <th className="pb-3 font-medium">Shares</th>
                  <th className="pb-3 font-medium">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.topPosts.map((post: any) => (
                  <tr key={post.id} className="border-b border-surface-light/50">
                    <td className="py-3 pr-4">
                      <p className="truncate max-w-xs">{post.content || 'No content'}</p>
                    </td>
                    <td className="py-3">
                      <span className="capitalize">{post.platform}</span>
                    </td>
                    <td className="py-3">{post.likes || 0}</td>
                    <td className="py-3">{post.comments || 0}</td>
                    <td className="py-3">{post.shares || 0}</td>
                    <td className="py-3">
                      <span className="text-green-400">{post.engagement || 0}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary text-center py-8">No posts data available yet</p>
        )}
      </div>

      {/* Platform breakdown */}
      {analyticsData?.accounts?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Platform Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {analyticsData.accounts.map((account: any) => {
              const platform = PLATFORMS.find(p => p.id === account.platform);
              return (
                <div key={account.id} className="p-4 rounded-lg bg-background border border-surface-light text-center">
                  <div className="text-2xl mb-2">{platform?.emoji}</div>
                  <p className="font-medium">{platform?.label}</p>
                  <p className="text-text-secondary text-sm">{account.profile_data?.followers || 0} followers</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
