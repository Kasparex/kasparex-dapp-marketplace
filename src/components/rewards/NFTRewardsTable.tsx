'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import { NFT_MULTIPLIER, DIAMOND_NFT_MULTIPLIER, RAREST_NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_FEE_REDUCTION } from '@/lib/rewards/types';
import { NFT_POINTS } from '@/lib/nft/points';
import type { NFTStatus } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { NFTBuyWizard } from './NFTBuyWizard';
import { useNFTStatus } from '@/hooks/useNFTStatus';

interface NFTRewardsTableProps {
  nftStatus: NFTStatus;
  nftPoints?: number;
}

export function NFTRewardsTable({ nftStatus, nftPoints = 0 }: NFTRewardsTableProps) {
  const { isConnected } = useAccount();
  const { nftPoints: actualNFTPoints } = useNFTStatus();
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
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      requirement: '1+ Regular NFT (KREXPRIME or PIXELKREX)',
      multiplier: NFT_MULTIPLIER,
      feeReduction: NFT_FEE_REDUCTION,
      points: NFT_POINTS.REGULAR,
      isUnlocked: hasAnyNFT && !hasDiamondNFT && !hasRarestNFT,
    },
    {
      id: 'diamond',
      name: 'Diamond NFT',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      requirement: '1+ Diamond NFT (any collection)',
      multiplier: DIAMOND_NFT_MULTIPLIER,
      feeReduction: DIAMOND_NFT_FEE_REDUCTION,
      points: NFT_POINTS.DIAMOND,
      isUnlocked: hasDiamondNFT && !hasRarestNFT,
    },
    {
      id: 'rarest',
      name: 'Rarest NFT',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      requirement: 'Rarest NFT (#515 PIXELKREX or #345 KREXPRIME)',
      multiplier: RAREST_NFT_MULTIPLIER,
      feeReduction: RAREST_NFT_FEE_REDUCTION,
      points: NFT_POINTS.RAREST,
      isUnlocked: hasRarestNFT,
    },
  ];

  const benefitRows = [
    { id: 'requirements', label: 'Requirements', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'multiplier', label: 'Multiplier', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )},
    { id: 'feeReduction', label: 'Fee Reduction', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'points', label: 'Points', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )},
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
      <div className="overflow-x-auto rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-50/30 dark:bg-zinc-900/30">
              <th className="border-b border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-left">
                Rewards
              </th>
              {nftTypes.map((nftType) => (
                <th
                  key={nftType.id}
                  className={`border-b border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                    nftType.isUnlocked ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">{nftType.icon}</span>
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
              <tr key={row.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-800/30 transition-colors border-b border-zinc-100/50 dark:border-zinc-800/50 last:border-b-0">
                <td className="border-r border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-50/20 dark:bg-zinc-900/20">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">{row.icon}</span>
                    <span>{row.label}</span>
                  </div>
                </td>
                {nftTypes.map((nftType) => {
                  const value = getCellValue(nftType, row.id);
                  
                  return (
                    <td
                      key={nftType.id}
                      className={`border-r border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center last:border-r-0 ${
                        nftType.isUnlocked ? 'bg-[#02abb8]/3 dark:bg-[#02abb8]/5' : ''
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
      <div className="mt-6 p-4 bg-zinc-50/30 dark:bg-zinc-900/30 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowNFTBuyWizard(true)}
            className="px-4 py-2 w-auto bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
          >
            Buy NFT
          </button>
          <div className="flex items-center justify-end">
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Your NFT Points
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {actualNFTPoints > 0 ? formatLargeNumber(actualNFTPoints) : '—'}
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
