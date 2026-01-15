'use client';

import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface TierRewardsTableProps {
  currentTier: KREXTier;
  krexBalance: number;
}

export function TierRewardsTable({ currentTier, krexBalance }: TierRewardsTableProps) {
  const tiers = Object.values(KREX_TIERS);

  // Define benefit rows
  const benefitRows = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'multiplier', label: 'Multiplier' },
    { id: 'feeReduction', label: 'Fee Reduction' },
    { id: 'pointsMultiplier', label: 'Points Multiplier' },
    { id: 'benefit1', label: 'Benefit 1' },
    { id: 'benefit2', label: 'Benefit 2' },
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
      case 'benefit1':
        // Example: Early Access for Tier 3+
        return tier.minKREX >= KREX_TIERS.Tier3.minKREX ? '✓' : '✗';
      case 'benefit2':
        // Example: Analytics Dashboard for Tier 4
        return tier.minKREX >= KREX_TIERS.Tier4.minKREX ? '✓' : '✗';
      default:
        return '—';
    }
  };

  const isTierUnlocked = (tier: typeof tiers[0]) => {
    return krexBalance >= tier.minKREX;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
              Rewards
            </th>
            {tiers.map((tier) => (
              <th
                key={tier.tier}
                className={`border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                  tier.tier === currentTier ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                }`}
              >
                <div>{tier.label}</div>
                {tier.tier === currentTier && (
                  <div className="text-xs text-[#02abb8] font-medium mt-1">(Current)</div>
                )}
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
                  {isTierUnlocked(tier) ? (
                    <span className="text-green-600 dark:text-green-400">Unlocked</span>
                  ) : (
                    <span className="text-zinc-400">Locked</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {benefitRows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <td className="border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900">
                {row.label}
              </td>
              {tiers.map((tier) => {
                const value = getCellValue(tier, row.id);
                const isUnlocked = isTierUnlocked(tier);
                
                return (
                  <td
                    key={tier.tier}
                    className={`border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center ${
                      tier.tier === currentTier ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                    }`}
                  >
                    {row.id.startsWith('benefit') ? (
                      <span className={value === '✓' ? 'text-green-600 dark:text-green-400 text-lg' : 'text-red-500 dark:text-red-400 text-lg'}>
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
  );
}
