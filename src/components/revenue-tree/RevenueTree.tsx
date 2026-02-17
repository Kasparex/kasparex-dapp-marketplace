'use client';

import { RevenueTreeData } from '@/lib/revenue-tree/types';
import { RevenueTreeLevel } from './RevenueTreeLevel';
import { ReferralLinkBox } from './ReferralLinkBox';
import { hasUserActivated } from '@/lib/revenue-tree/utils';
import { useChainId } from 'wagmi';

interface RevenueTreeProps {
  data: RevenueTreeData;
  userWalletAddress?: string;
  isL2Only?: boolean; // Only show for L2 dApps
  activationAmount?: number; // Amount spent toward activation (default: 100 KAS)
}

export function RevenueTree({ data, userWalletAddress, isL2Only = true, activationAmount = 0 }: RevenueTreeProps) {
  const chainId = useChainId();
  
  // Check if user has activated
  const isActivated = userWalletAddress ? hasUserActivated(userWalletAddress, data.contentType, data.contentSlug) : false;
  
  // Get currency symbol based on chain
  const getCurrencySymbol = () => {
    if (chainId === 38837) return 'iKAS'; // IGRA Galleon Test Mainnet
    if (chainId === 167012) return 'tKAS'; // Kasplex L2 Testnet
    return 'KAS';
  };
  
  const currencySymbol = getCurrencySymbol();
  const requiredAmount = 100;
  const progress = Math.min((activationAmount / requiredAmount) * 100, 100);
  
  // Sort levels from 5 to 1 (top to bottom)
  const sortedLevels = [...data.levels].sort((a, b) => b.level - a.level);

  // Don't show if L1 dApp
  if (isL2Only === false) {
    return (
      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Revenue Tree is only available for L2 (IGRA) dApps
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-2 py-2 border-b border-zinc-100 dark:border-zinc-800">
          Revenue Tree
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 italic">
          Rotating revenue share system • 5 levels • Revenue distributed automatically on each payment
        </p>
      </div>

      {/* Progress Bar - Show if not activated */}
      {!isActivated && userWalletAddress && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Activation Progress
            </span>
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              {activationAmount.toFixed(2)} / {requiredAmount} {currencySymbol}
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#02abb8] to-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Spend {requiredAmount} {currencySymbol} to activate your Revenue Tree and start earning
          </p>
        </div>
      )}

      {/* Levels */}
      <div className="space-y-3">
        {sortedLevels.map((level) => {
          const isCurrentUser = Boolean(userWalletAddress && 
            (level.walletAddress.toLowerCase() === userWalletAddress.toLowerCase() ||
             (userWalletAddress.length >= 4 && level.walletAddress.includes(userWalletAddress.slice(-4)))));
          
          return (
            <RevenueTreeLevel
              key={level.level}
              level={level}
              isCurrentUser={isCurrentUser}
              contentType={data.contentType}
              contentSlug={data.contentSlug}
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
