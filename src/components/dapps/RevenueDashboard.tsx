'use client';

import { useDAppRevenue } from '@/hooks/useDAppRevenue';

export function RevenueDashboard() {
  const { data: revenueData, isLoading } = useDAppRevenue();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#02abb8]"></div>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading revenue data...</p>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          No Revenue Data
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          Revenue data will appear here once your dApps start generating fees.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Fees Collected
          </h4>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {parseFloat(revenueData.totalFeesCollected).toFixed(6)} KAS
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Treasury Balance
          </h4>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {parseFloat(revenueData.treasuryBalance).toFixed(6)} KAS
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h4 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Developer Share
          </h4>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {revenueData.developerShare} KAS
          </p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Revenue Distribution
        </h4>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Treasury</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {revenueData.treasuryShare} KAS
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
              <div
                className="bg-[#02abb8] h-2 rounded-full"
                style={{ width: `${(parseFloat(revenueData.treasuryShare) / parseFloat(revenueData.totalFeesCollected || '1')) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Developer</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {revenueData.developerShare} KAS
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(parseFloat(revenueData.developerShare) / parseFloat(revenueData.totalFeesCollected || '1')) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Builder</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {revenueData.builderShare} KAS
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(parseFloat(revenueData.builderShare) / parseFloat(revenueData.totalFeesCollected || '1')) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 How Revenue Works
        </h5>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Revenue from your dApps is automatically collected through the Treasury contract and
          distributed according to the configured percentages. Developer share is sent directly to
          your wallet address.
        </p>
      </div>
    </div>
  );
}

