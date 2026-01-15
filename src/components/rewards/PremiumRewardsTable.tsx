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
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      requirement: 'Tier 3+ KREX or Diamond NFT',
      isUnlocked: tierConfig.minKREX >= KREX_TIERS.Tier3.minKREX || hasDiamondNFT || hasRarestNFT,
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      requirement: 'Tier 4 KREX',
      isUnlocked: tierConfig.minKREX >= KREX_TIERS.Tier4.minKREX,
    },
    {
      id: 'governance',
      name: 'Governance Participation',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      requirement: 'Tier 3+ KREX',
      isUnlocked: tierConfig.minKREX >= KREX_TIERS.Tier3.minKREX,
    },
  ];

  const benefitRows = [
    { id: 'requirements', label: 'Requirements', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'benefit1', label: 'Benefit 1', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'benefit2', label: 'Benefit 2', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
  ];

  const getCellValue = (feature: typeof premiumFeatures[0], rowId: string) => {
    switch (rowId) {
      case 'requirements':
        return feature.requirement;
      case 'benefit1':
        // Example benefits - adjust based on actual requirements
        if (feature.id === 'early-access') {
          return feature.isUnlocked;
        } else if (feature.id === 'analytics') {
          return feature.isUnlocked;
        } else {
          return feature.isUnlocked;
        }
      case 'benefit2':
        if (feature.id === 'early-access') {
          return false; // Second benefit not available for early access
        } else if (feature.id === 'analytics') {
          return feature.isUnlocked;
        } else {
          return feature.isUnlocked;
        }
      default:
        return false;
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-zinc-50/30 dark:bg-zinc-900/30">
            <th className="border-b border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
              Rewards
            </th>
            {premiumFeatures.map((feature) => (
              <th
                key={feature.id}
                className={`border-b border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                  feature.isUnlocked ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400">{feature.icon}</span>
                  <span>{feature.name}</span>
                </div>
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
            <tr key={row.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-100/50 dark:border-zinc-800/50 last:border-b-0">
              <td className="border-r border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50/20 dark:bg-zinc-900/20">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-zinc-400">{row.icon}</span>
                  <span>{row.label}</span>
                </div>
              </td>
              {premiumFeatures.map((feature) => {
                const value = getCellValue(feature, row.id);
                
                return (
                  <td
                    key={feature.id}
                    className={`border-r border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center last:border-r-0 ${
                      feature.isUnlocked ? 'bg-[#02abb8]/3 dark:bg-[#02abb8]/5' : ''
                    }`}
                  >
                    {row.id.startsWith('benefit') ? (
                      <span className={value ? 'text-green-600 dark:text-green-400 text-lg' : 'text-red-500 dark:text-red-400 text-lg'}>
                        {value ? '✓' : '✗'}
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
