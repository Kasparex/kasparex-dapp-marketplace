'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { KREXBuyWizard } from './KREXBuyWizard';

interface TierRewardsTableProps {
  currentTier: KREXTier;
  krexBalance: number;
}

export function TierRewardsTable({ currentTier, krexBalance }: TierRewardsTableProps) {
  const { isConnected } = useAccount();
  const [showKREXBuyWizard, setShowKREXBuyWizard] = useState(false);
  const tiers = Object.values(KREX_TIERS);

  // Only highlight tier if user actually has KREX (balance > 0)
  const hasKREX = krexBalance > 0;
  const effectiveTier = hasKREX ? currentTier : null;

  // Define benefit rows
  const benefitRows = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'multiplier', label: 'Multiplier' },
    { id: 'feeReduction', label: 'Fee Reduction' },
    { id: 'pointsMultiplier', label: 'Points Multiplier' },
    { id: 'tierBadge', label: 'Tier Badge' },
    { id: 'benefit1', label: 'Early Access' },
    { id: 'benefit2', label: 'Analytics Dashboard' },
  ];

  const getCellValue = (tier: typeof tiers[0], rowId: string) => {
    switch (rowId) {
      case 'requirements':
        return tier.minKREX === 0 ? '< 10M KREX' : `≥ ${formatLargeNumber(tier.minKREX)} KREX`;
      case 'multiplier':
        return `${tier.multiplier}x`;
      case 'feeReduction':
        return `-${tier.feeReduction}%`;
      case 'pointsMultiplier':
        return `${tier.pointsMultiplier}x`;
      case 'tierBadge':
        return tier.tier !== 'Tier1' ? '👑' : '—';
      case 'benefit1':
        // Early Access for Tier 3+
        return tier.minKREX >= KREX_TIERS.Tier3.minKREX ? '✓' : '✗';
      case 'benefit2':
        // Analytics Dashboard for Tier 4
        return tier.minKREX >= KREX_TIERS.Tier4.minKREX ? '✓' : '✗';
      default:
        return '—';
    }
  };

  const isTierUnlocked = (tier: typeof tiers[0]) => {
    return krexBalance >= tier.minKREX;
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="border-b border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
                Rewards
              </th>
              {tiers.map((tier) => {
                const isCurrentTier = hasKREX && tier.tier === effectiveTier;
                return (
                  <th
                    key={tier.tier}
                    className={`border-b border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                      isCurrentTier ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {tier.tier !== 'Tier1' && <span className="text-lg">👑</span>}
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
              <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
                <td className="border-r border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900">
                  {row.label}
                </td>
                {tiers.map((tier) => {
                  const value = getCellValue(tier, row.id);
                  const isUnlocked = isTierUnlocked(tier);
                  const isCurrentTier = hasKREX && tier.tier === effectiveTier;
                  
                  return (
                    <td
                      key={tier.tier}
                      className={`border-r border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center last:border-r-0 ${
                        isCurrentTier ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                      }`}
                    >
                      {row.id.startsWith('benefit') || row.id === 'tierBadge' ? (
                        <span className={value === '✓' || value === '👑' ? 'text-green-600 dark:text-green-400 text-lg' : value === '✗' ? 'text-red-500 dark:text-red-400 text-lg' : 'text-zinc-400'}>
                          {value}
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
      <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowKREXBuyWizard(true)}
            className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
          >
            Buy KREX
          </button>
          <div className="flex items-center justify-end">
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Your KREX Balance
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {isConnected ? formatLargeNumber(krexBalance) : '—'}
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
