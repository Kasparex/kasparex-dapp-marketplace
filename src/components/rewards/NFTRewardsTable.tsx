'use client';

import { NFT_MULTIPLIER, DIAMOND_NFT_MULTIPLIER, RAREST_NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_FEE_REDUCTION } from '@/lib/rewards/types';
import { NFT_POINTS } from '@/lib/nft/points';
import type { NFTStatus } from '@/lib/rewards/types';

interface NFTRewardsTableProps {
  nftStatus: NFTStatus;
}

export function NFTRewardsTable({ nftStatus }: NFTRewardsTableProps) {
  const hasAnyNFT = !!(nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX ||
    (nftStatus.partnerCollections && Object.values(nftStatus.partnerCollections).some(v => v)));
  const hasDiamondNFT = !!(nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX ||
    (nftStatus.partnerDiamonds && Object.values(nftStatus.partnerDiamonds).some(v => v)));
  const hasRarestNFT = !!nftStatus.hasRarestNFT;

  const nftTypes = [
    {
      id: 'regular',
      name: 'Regular NFT',
      requirement: '1+ Regular NFT (KREXPRIME or PIXELKREX)',
      multiplier: NFT_MULTIPLIER,
      feeReduction: NFT_FEE_REDUCTION,
      points: NFT_POINTS.REGULAR,
      isUnlocked: hasAnyNFT && !hasDiamondNFT && !hasRarestNFT,
    },
    {
      id: 'diamond',
      name: 'Diamond NFT',
      requirement: '1+ Diamond NFT (any collection)',
      multiplier: DIAMOND_NFT_MULTIPLIER,
      feeReduction: DIAMOND_NFT_FEE_REDUCTION,
      points: NFT_POINTS.DIAMOND,
      isUnlocked: hasDiamondNFT && !hasRarestNFT,
    },
    {
      id: 'rarest',
      name: 'Rarest NFT',
      requirement: 'Rarest NFT (#515 PIXELKREX or #345 KREXPRIME)',
      multiplier: RAREST_NFT_MULTIPLIER,
      feeReduction: RAREST_NFT_FEE_REDUCTION,
      points: NFT_POINTS.RAREST,
      isUnlocked: hasRarestNFT,
    },
  ];

  const benefitRows = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'multiplier', label: 'Multiplier' },
    { id: 'feeReduction', label: 'Fee Reduction' },
    { id: 'points', label: 'Points' },
  ];

  const getCellValue = (nftType: typeof nftTypes[0], rowId: string) => {
    switch (rowId) {
      case 'requirements':
        return nftType.requirement;
      case 'multiplier':
        return `+${nftType.multiplier}x`;
      case 'feeReduction':
        return nftType.feeReduction === 100 ? 'Zero Fee' : `-${nftType.feeReduction}%`;
      case 'points':
        return `${nftType.points} ${nftType.points === 1 ? 'point' : 'points'}`;
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
            {nftTypes.map((nftType) => (
              <th
                key={nftType.id}
                className={`border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                  nftType.isUnlocked ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                }`}
              >
                <div>{nftType.name}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal">
                  {nftType.isUnlocked ? (
                    <span className="text-green-600 dark:text-green-400">Owned</span>
                  ) : (
                    <span className="text-zinc-400">Not Owned</span>
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
              {nftTypes.map((nftType) => {
                const value = getCellValue(nftType, row.id);
                
                return (
                  <td
                    key={nftType.id}
                    className={`border border-zinc-300 dark:border-zinc-700 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center ${
                      nftType.isUnlocked ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                    }`}
                  >
                    <span className={nftType.isUnlocked ? '' : 'text-zinc-400'}>
                      {value}
                    </span>
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
