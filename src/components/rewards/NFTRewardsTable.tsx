'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import { NFT_MULTIPLIER, DIAMOND_NFT_MULTIPLIER, RAREST_NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_FEE_REDUCTION } from '@/lib/rewards/types';
import { NFT_POINTS } from '@/lib/nft/points';
import type { NFTStatus } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { NFTBuyWizard } from './NFTBuyWizard';

interface NFTRewardsTableProps {
  nftStatus: NFTStatus;
  nftPoints?: number;
}

export function NFTRewardsTable({ nftStatus, nftPoints = 0 }: NFTRewardsTableProps) {
  const { isConnected } = useAccount();
  const [showNFTBuyWizard, setShowNFTBuyWizard] = useState(false);
  const hasAnyNFT = !!(nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX ||
    (nftStatus.partnerCollections && Object.values(nftStatus.partnerCollections).some(v => v)));
  const hasDiamondNFT = !!(nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX ||
    (nftStatus.partnerDiamonds && Object.values(nftStatus.partnerDiamonds).some(v => v)));
  const hasRarestNFT = !!nftStatus.hasRarestNFT;

  const nftTypes = [
    {
      id: 'regular',
      name: 'Regular NFT',
      icon: '🖼️',
      requirement: '1+ Regular NFT (KREXPRIME or PIXELKREX)',
      multiplier: NFT_MULTIPLIER,
      feeReduction: NFT_FEE_REDUCTION,
      points: NFT_POINTS.REGULAR,
      isUnlocked: hasAnyNFT && !hasDiamondNFT && !hasRarestNFT,
    },
    {
      id: 'diamond',
      name: 'Diamond NFT',
      icon: '💎',
      requirement: '1+ Diamond NFT (any collection)',
      multiplier: DIAMOND_NFT_MULTIPLIER,
      feeReduction: DIAMOND_NFT_FEE_REDUCTION,
      points: NFT_POINTS.DIAMOND,
      isUnlocked: hasDiamondNFT && !hasRarestNFT,
    },
    {
      id: 'rarest',
      name: 'Rarest NFT',
      icon: '⭐',
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
    <>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="border-b border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
                Rewards
              </th>
              {nftTypes.map((nftType) => (
                <th
                  key={nftType.id}
                  className={`border-b border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                    nftType.isUnlocked ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{nftType.icon}</span>
                    <span>{nftType.name}</span>
                  </div>
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
              <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
                <td className="border-r border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900">
                  {row.label}
                </td>
                {nftTypes.map((nftType) => {
                  const value = getCellValue(nftType, row.id);
                  
                  return (
                    <td
                      key={nftType.id}
                      className={`border-r border-zinc-200 dark:border-zinc-700 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center last:border-r-0 ${
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

      {/* Action Buttons Section */}
      <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowNFTBuyWizard(true)}
            className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
          >
            Buy NFT
          </button>
          <div className="flex items-center justify-end">
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Your NFT Points
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {isConnected ? formatLargeNumber(nftPoints) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Buy Wizard */}
      {showNFTBuyWizard && typeof window !== 'undefined' && createPortal(
        <NFTBuyWizard
          isOpen={showNFTBuyWizard}
          onClose={() => setShowNFTBuyWizard(false)}
        />,
        document.body
      )}
    </>
  );
}
