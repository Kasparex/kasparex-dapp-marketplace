'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { KREX_TIERS, type KREXTier, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_FEE_REDUCTION } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { KREXBuyWizard } from './KREXBuyWizard';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { TierBadge } from './TierBadge';
import { RewardTooltip } from './RewardTooltip';

interface TierRewardsTableProps {
  currentTier: KREXTier;
  krexBalance: number;
}

export function TierRewardsTable({ currentTier, krexBalance }: TierRewardsTableProps) {
  const { isConnected } = useAccount();
  const { balance: totalKREX, l1Balance, l2Balance } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const [showKREXBuyWizard, setShowKREXBuyWizard] = useState(false);
  const tiers = Object.values(KREX_TIERS);

  // Only highlight tier if user actually has KREX (balance > 0)
  const hasKREX = krexBalance > 0;
  const effectiveTier = hasKREX ? currentTier : null;

  // Calculate NFT status for fee reduction
  const hasAnyNFT = !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX ||
    (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections).some(v => v)));
  const hasDiamondNFT = !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ||
    (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds).some(v => v)));
  const hasRarestNFT = !!nftStatus?.hasRarestNFT;

  // Calculate actual fee with reductions
  const baseFee = 1.0;
  const calculateActualFee = (tier: typeof tiers[0]) => {
    let fee = baseFee;
    // Apply tier reduction
    fee = Math.max(0, fee - tier.feeReduction);
    // Apply NFT reductions (stack with tier reduction)
    if (hasRarestNFT) {
      fee = 0; // Zero fee
    } else if (hasDiamondNFT) {
      fee = Math.max(0, fee - DIAMOND_NFT_FEE_REDUCTION);
    } else if (hasAnyNFT) {
      fee = Math.max(0, fee - NFT_FEE_REDUCTION);
    }
    return fee;
  };

  // Define benefit rows with icons and tooltips
  const benefitRows = [
    { 
      id: 'requirements', 
      label: 'Requirements', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tooltip: 'Minimum KREX token balance required to unlock this tier and its associated benefits.',
    },
    { 
      id: 'multiplier', 
      label: 'Multiplier', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      tooltip: 'Reward multiplier that increases your GRID and dApp token earnings based on your KREX tier level.',
    },
    { 
      id: 'feeReduction', 
      label: 'Fee Reduction', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tooltip: 'Percentage reduction applied to transaction fees. Higher tiers provide greater fee savings on all dApp interactions.',
    },
    { 
      id: 'pointsMultiplier', 
      label: 'Points Multiplier', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      tooltip: 'Multiplier that increases your XP points earnings, helping you level up faster in the Kasparex ecosystem.',
    },
    { 
      id: 'tierBadge', 
      label: 'Tier Badge', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      tooltip: 'Visual badge displayed on your profile and across supported dApps, showcasing your KREX tier status and achievements.',
    },
    { 
      id: 'benefit1', 
      label: 'vBlog Premium', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      tooltip: 'Unlock premium articles and author tools on vBlog. Access exclusive content and advanced publishing features for Tier 3+ holders.',
    },
    { 
      id: 'benefit2', 
      label: 'Unlimited Comments', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      tooltip: 'Unlimited comments across the entire Kasparex Hub without needing to top up credits. Tier 4 holders can comment freely on all platforms.',
    },
  ];

  const getCellValue = (tier: typeof tiers[0], rowId: string) => {
    switch (rowId) {
      case 'requirements':
        return tier.minKREX === 0 ? '0 KREX' : `≥ ${formatLargeNumber(tier.minKREX)} KREX`;
      case 'multiplier':
        // Always show the tier's multiplier value, regardless of wallet connection
        return `${tier.multiplier}x`;
      case 'feeReduction':
        const actualFee = calculateActualFee(tier);
        const hasReduction = actualFee < baseFee;
        if (hasReduction) {
          return (
            <div className="flex items-center justify-center gap-2">
              <span className="line-through text-zinc-400">{baseFee.toFixed(2)}%</span>
              <span className="text-green-600 dark:text-green-400">{actualFee.toFixed(2)}%</span>
            </div>
          );
        }
        return `${baseFee.toFixed(2)}%`;
      case 'pointsMultiplier':
        // Always show the tier's points multiplier value, regardless of wallet connection
        return `${tier.pointsMultiplier}x`;
      case 'tierBadge':
        return true; // All tiers have badges now
      case 'benefit1':
        // vBlog Premium for Tier 3+
        return tier.minKREX >= KREX_TIERS.Tier3.minKREX;
      case 'benefit2':
        // Unlimited Comments for Tier 4
        return tier.minKREX >= KREX_TIERS.Tier4.minKREX;
      default:
        return false;
    }
  };

  const isTierUnlocked = (tier: typeof tiers[0]) => {
    return krexBalance >= tier.minKREX;
  };


  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-zinc-50/30 dark:bg-zinc-900/30">
              <th className="border-b border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
                Rewards
              </th>
              {tiers.map((tier) => {
                const isCurrentTier = hasKREX && tier.tier === effectiveTier;
                return (
                  <th
                    key={tier.tier}
                    className={`border-b border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                      isCurrentTier ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span>{tier.label}</span>
                    </div>
                    {isCurrentTier && (
                      <div className="text-xs text-[#02abb8] font-medium mt-1">(Current)</div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {benefitRows.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-100/50 dark:border-zinc-800/50 last:border-b-0">
                <td className="border-r border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50/20 dark:bg-zinc-900/20">
                  <RewardTooltip description={row.tooltip}>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 dark:text-zinc-400">{row.icon}</span>
                      <span>{row.label}</span>
                    </div>
                  </RewardTooltip>
                </td>
                {tiers.map((tier) => {
                  const value = getCellValue(tier, row.id);
                  const isUnlocked = isTierUnlocked(tier);
                  const isCurrentTier = hasKREX && tier.tier === effectiveTier;
                  return (
                    <td
                      key={tier.tier}
                      className={`border-r border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center last:border-r-0 ${
                        isCurrentTier ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                      }`}
                    >
                      {row.id === 'tierBadge' ? (
                        <div className="flex justify-center">
                          <TierBadge tier={tier.tier} isUnlocked={isUnlocked} />
                        </div>
                      ) : row.id === 'feeReduction' ? (
                        typeof value === 'string' ? (
                          <span className={isUnlocked ? '' : 'text-zinc-400'}>
                            {value}
                          </span>
                        ) : (
                          value
                        )
                      ) : row.id.startsWith('benefit') ? (
                        <span className={value ? 'text-green-600 dark:text-green-400 text-lg' : 'text-red-500 dark:text-red-400 text-lg'}>
                          {value ? '✓' : '✗'}
                        </span>
                      ) : (
                        <span className={isUnlocked ? '' : 'text-zinc-400'}>
                          {value}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons Section */}
      <div className="mt-6 p-4 bg-zinc-50/30 dark:bg-zinc-900/30 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => setShowKREXBuyWizard(true)}
            className="px-4 py-2 w-auto max-w-[150px] bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors text-sm"
          >
            Buy KREX
          </button>
          <div className="flex items-center justify-end">
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Your KREX Balance
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {(l1Balance > 0 || l2Balance > 0) ? formatLargeNumber(totalKREX) : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KREX Buy Wizard */}
      {showKREXBuyWizard && typeof window !== 'undefined' && createPortal(
        <KREXBuyWizard
          isOpen={showKREXBuyWizard}
          onClose={() => setShowKREXBuyWizard(false)}
        />,
        document.body
      )}
    </>
  );
}
