'use client';

import { useState } from 'react';
import { useMyDApps } from '@/hooks/useMyDApps';
import { MyDAppsList } from './MyDAppsList';
import { RevenueDashboard } from './RevenueDashboard';
import { SubscriptionManager } from './SubscriptionManager';
import { AnalyticsCard } from './AnalyticsCard';

type DashboardTab = 'overview' | 'revenue' | 'subscriptions' | 'analytics';

export function ListDAppDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const { dApps, isLoading, totalCount, isEmpty } = useMyDApps();

  const tabs: { id: DashboardTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'My dApps', icon: '📱' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '🔔' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  // Calculate stats for overview cards
  const stats = {
    totalDApps: totalCount,
    totalRevenue: '0', // Would come from revenue hook
    activeSubscriptions: 0, // Would come from subscription hook
    totalUsers: 0, // Would come from analytics hook
  };

  return (
    <div className="w-full">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AnalyticsCard
          title="Total dApps"
          value={stats.totalDApps.toString()}
          icon="📱"
          description="Your published dApps"
        />
        <AnalyticsCard
          title="Total Revenue"
          value={`${stats.totalRevenue} KAS`}
          icon="💰"
          description="All-time earnings"
        />
        <AnalyticsCard
          title="Active Subscriptions"
          value={stats.activeSubscriptions.toString()}
          icon="🔔"
          description="Current subscribers"
        />
        <AnalyticsCard
          title="Total Users"
          value={stats.totalUsers.toString()}
          icon="👥"
          description="All-time users"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#02abb8] text-[#02abb8]'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <MyDAppsList dApps={dApps} isLoading={isLoading} isEmpty={isEmpty} />
        )}
        {activeTab === 'revenue' && <RevenueDashboard />}
        {activeTab === 'subscriptions' && <SubscriptionManager />}
        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Analytics Coming Soon
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Detailed analytics and insights will be available here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

