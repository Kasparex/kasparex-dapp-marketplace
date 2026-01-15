'use client';

import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import type { NFTStatus } from '@/lib/rewards/types';

interface PremiumRewardsTableProps {
  krexTier: KREXTier;
  nftStatus: NFTStatus;
}

export function PremiumRewardsTable({ krexTier, nftStatus }: PremiumRewardsTableProps) {
  const hasDiamondNFT = !!(nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX ||
    (nftStatus.partnerDiamonds && Object.values(nftStatus.partnerDiamonds).some(v => v)));
  const hasRarestNFT = !!nftStatus.hasRarestNFT;

  const tierConfig = KREX_TIERS[krexTier];

  const premiumFeatures = [
    {
      id: 'early-access',
      name: 'Early Access',
      requirement: 'Tier 3+ KREX or Diamond NFT',
      isUnlocked: tierConfig.minKREX >= KREX_TIERS.Tier3.minKREX || hasDiamondNFT || hasRarestNFT,
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      requirement: 'Tier 4 KREX',
      isUnlocked: tierConfig.minKREX >= KREX_TIERS.Tier4.minKREX,
    },
    {
      id: 'governance',
      name: 'Governance Participation',
      requirement: 'Tier 3+ KREX',
      isUnlocked: tierConfig.minKREX >= KREX_TIERS.Tier3.minKREX,
    },
  ];

  const benefitRows = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'benefit1', label: 'Benefit 1' },
    { id: 'benefit2', label: 'Benefit 2' },
  ];

  const getCellValue = (feature: typeof premiumFeatures[0], rowId: string) => {
    switch (rowId) {
      case 'requirements':
        return feature.requirement;
      case 'benefit1':
        // Example benefits - adjust based on actual requirements
        if (feature.id === 'early-access') {
          return feature.isUnlocked ? '✓' : '✗';
        } else if (feature.id === 'analytics') {
          return feature.isUnlocked ? '✓' : '✗';
        } else {
          return feature.isUnlocked ? '✓' : '✗';
        }
      case 'benefit2':
        if (feature.id === 'early-access') {
          return '✗'; // Second benefit not available for early access
        } else if (feature.id === 'analytics') {
          return feature.isUnlocked ? '✓' : '✗';
        } else {
          return feature.isUnlocked ? '✓' : '✗';
        }
      default:
        return '—';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
              Rewards
            </th>
            {premiumFeatures.map((feature) => (
              <th
                key={feature.id}
                className={`border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                  feature.isUnlocked ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                }`}
              >
                <div>{feature.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
                  {feature.isUnlocked ? (
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
              {premiumFeatures.map((feature) => {
                const value = getCellValue(feature, row.id);
                
                return (
                  <td
                    key={feature.id}
                    className={`border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center ${
                      feature.isUnlocked ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                    }`}
                  >
                    {row.id.startsWith('benefit') ? (
                      <span className={value === '✓' ? 'text-green-600 dark:text-green-400 text-lg' : 'text-red-500 dark:text-red-400 text-lg'}>
                        {value}
                      </span>
                    ) : (
                      <span className={feature.isUnlocked ? '' : 'text-zinc-400'}>
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
