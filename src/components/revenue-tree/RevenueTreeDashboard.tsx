'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { RevenueTreeStats } from './RevenueTreeStats';
import { RevenueTreeTabs } from './RevenueTreeTabs';
import { RevenueTreeList } from './RevenueTreeList';
import { RevenueTreeSidebar } from './RevenueTreeSidebar';
import { RevenueTreeData, RevenueTreeContentType } from '@/lib/revenue-tree/types';
import { getAllMockRevenueTrees } from '@/lib/revenue-tree/mockData';

export function RevenueTreeDashboard() {
  const { address: userWalletAddress } = useAccount();
  const [activeTab, setActiveTab] = useState<RevenueTreeContentType | 'all'>('all');

  // Get mock data (will be replaced with real data later)
  const trees: RevenueTreeData[] = userWalletAddress
    ? getAllMockRevenueTrees(userWalletAddress)
    : [];

  // Calculate stats
  const totalRevenue = trees.reduce((sum, tree) => sum + tree.totalEarned, 0);
  const activeTrees = trees.filter(tree => tree.isActive).length;
  const totalDownline = trees.reduce((sum, tree) => sum + tree.revenueTreesCount, 0);
  const totalVolume = totalRevenue * 10; // Mock calculation

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <RevenueTreeSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalRevenue={totalRevenue}
          activeTrees={activeTrees}
          totalDownline={totalDownline}
        />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <RevenueTreeSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalRevenue={totalRevenue}
          activeTrees={activeTrees}
          totalDownline={totalDownline}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
              Revenue Tree Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage your revenue trees, track earnings, and view your referral network
            </p>
          </div>

          {/* Stats Panels */}
          <RevenueTreeStats
            totalRevenue={totalRevenue}
            activeTrees={activeTrees}
            totalDownline={totalDownline}
            totalVolume={totalVolume}
          />

          {/* Tabs */}
          <RevenueTreeTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tree List */}
          <RevenueTreeList trees={trees} activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
