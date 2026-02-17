'use client';

import { RevenueTreeData } from '@/lib/revenue-tree/types';
import { RevenueTreeLevel } from './RevenueTreeLevel';
import { ReferralLinkBox } from './ReferralLinkBox';

interface RevenueTreeProps {
  data: RevenueTreeData;
  userWalletAddress?: string;
}

export function RevenueTree({ data, userWalletAddress }: RevenueTreeProps) {
  // Sort levels from 5 to 1 (top to bottom)
  const sortedLevels = [...data.levels].sort((a, b) => b.level - a.level);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-6 py-2 border-b border-zinc-100 dark:border-zinc-800">
          Revenue Tree
        </h3>
      </div>

      {/* Levels */}
      <div className="space-y-3">
        {sortedLevels.map((level) => {
          const isCurrentUser = userWalletAddress && 
            (level.walletAddress.toLowerCase() === userWalletAddress.toLowerCase() ||
             level.walletAddress.includes(userWalletAddress.slice(-4)));
          
          return (
            <RevenueTreeLevel
              key={level.level}
              level={level}
              isCurrentUser={isCurrentUser}
            />
          );
        })}
      </div>

      {/* Total Earned Section */}
      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Total Earned:
          </div>
          <div className="text-lg font-black text-[#02abb8]">
            {data.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-zinc-500 dark:text-zinc-400 font-bold">KAS</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Revenue Trees with your address:
          </div>
          <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
            {data.revenueTreesCount}
          </div>
        </div>
      </div>

      {/* Referral Link Box */}
      <div className="pt-4">
        <ReferralLinkBox
          referralLink={data.referralLink}
          isActive={data.isActive}
          contentType={data.contentType}
        />
      </div>
    </div>
  );
}
