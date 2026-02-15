'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import { NFT_MULTIPLIER, DIAMOND_NFT_MULTIPLIER, RAREST_NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_FEE_REDUCTION, NFT_COST_REDUCTION, DIAMOND_NFT_COST_REDUCTION, RAREST_NFT_COST_REDUCTION } from '@/lib/rewards/types';
import { NFT_POINTS } from '@/lib/nft/points';
import type { NFTStatus } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { NFTBuyWizard } from './NFTBuyWizard';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { isDiamondNFT } from '@/lib/nft/diamond-detection';
import { fetchMultipleNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import { RewardTooltip } from './RewardTooltip';

interface NFTRewardsTableProps {
  nftStatus: NFTStatus;
  nftPoints?: number;
}

function isRareNFT(collectionId: string, tokenId: number): boolean {
  const RARE_NFT_IDS: Record<string, number[]> = {
    KREXPRIME: [345],
    PIXELKREX: [515],
  };
  const rareIds = RARE_NFT_IDS[collectionId];
  return rareIds ? rareIds.includes(tokenId) : false;
}

export function NFTRewardsTable({ nftStatus, nftPoints = 0 }: NFTRewardsTableProps) {
  const { isConnected } = useAccount();
  const { nftPoints: actualNFTPoints, nfts } = useNFTStatus();
  const [showNFTBuyWizard, setShowNFTBuyWizard] = useState(false);
  const [regularCount, setRegularCount] = useState(0);
  const [diamondCount, setDiamondCount] = useState(0);
  const [rarestCount, setRarestCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const hasAnyNFT = !!(nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX ||
    (nftStatus.partnerCollections && Object.values(nftStatus.partnerCollections).some(v => v)));
  const hasDiamondNFT = !!(nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX ||
    (nftStatus.partnerDiamonds && Object.values(nftStatus.partnerDiamonds).some(v => v)));
  const hasRarestNFT = !!nftStatus.hasRarestNFT;

  // Calculate NFT counts
  useEffect(() => {
    if (!nfts || nfts.length === 0) {
      setRegularCount(0);
      setDiamondCount(0);
      setRarestCount(0);
      setTotalCount(0);
      return;
    }

    const calculateCounts = async () => {
      const metadataMap = new Map<string, ParsedNFTMetadata>();
      
      // Group NFTs by collection
      const nftsByCollection = new Map<string, typeof nfts>();
      nfts.forEach((nft) => {
        if (!nftsByCollection.has(nft.collection)) {
          nftsByCollection.set(nft.collection, []);
        }
        nftsByCollection.get(nft.collection)!.push(nft);
      });

      // Fetch metadata for each collection
      for (const [collectionId, collectionNFTs] of nftsByCollection.entries()) {
        const tokenIds = collectionNFTs.map(nft => nft.tokenId);
        const collectionMetadata = await fetchMultipleNFTMetadata(collectionId, tokenIds);
        collectionMetadata.forEach((metadata, tokenId) => {
          metadataMap.set(`${collectionId}-${tokenId}`, metadata);
        });
      }

      // Count diamonds, regular, and rarest
      let regular = 0;
      let diamond = 0;
      let rarest = 0;

      nfts.forEach((nft) => {
        const metadataKey = `${nft.collection}-${nft.tokenId}`;
        const metadata = metadataMap.get(metadataKey) || null;
        const isDiamond = isDiamondNFT(nft.collection, metadata);
        const isRarest = isRareNFT(nft.collection, nft.tokenId);
        
        if (isRarest) {
          rarest++;
        } else if (isDiamond) {
          diamond++;
        } else {
          regular++;
        }
      });

      setRegularCount(regular);
      setDiamondCount(diamond);
      setRarestCount(rarest);
      setTotalCount(nfts.length);
    };

    calculateCounts();
  }, [nfts]);

  const nftTypes = [
    {
      id: 'regular',
      name: 'Regular NFT',
      icon: '🖼️',
      requirement: '1+ Regular NFT',
      multiplier: NFT_MULTIPLIER,
      feeReduction: NFT_FEE_REDUCTION,
      costReduction: NFT_COST_REDUCTION,
      points: NFT_POINTS.REGULAR,
      isUnlocked: regularCount > 0,
      count: regularCount,
    },
    {
      id: 'diamond',
      name: 'Diamond NFT',
      icon: '💎',
      requirement: '1+ Diamond NFT',
      multiplier: DIAMOND_NFT_MULTIPLIER,
      feeReduction: DIAMOND_NFT_FEE_REDUCTION,
      costReduction: DIAMOND_NFT_COST_REDUCTION,
      points: NFT_POINTS.DIAMOND,
      isUnlocked: diamondCount > 0,
      count: diamondCount,
    },
    {
      id: 'rarest',
      name: 'Rarest NFT',
      icon: '⭐',
      requirement: 'Rarest NFT',
      multiplier: RAREST_NFT_MULTIPLIER,
      feeReduction: RAREST_NFT_FEE_REDUCTION,
      costReduction: RAREST_NFT_COST_REDUCTION,
      points: NFT_POINTS.RAREST,
      isUnlocked: hasRarestNFT,
      count: rarestCount,
    },
  ];

  const benefitRows = [
    { 
      id: 'count', 
      label: 'Owned', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      tooltip: 'Number of NFTs you currently own in this category. Higher counts unlock additional benefits and rewards.',
    },
    { 
      id: 'requirements', 
      label: 'Requirements', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tooltip: 'Minimum NFT ownership requirements needed to unlock this reward tier and its associated benefits.',
    },
    { 
      id: 'multiplier', 
      label: 'Multiplier', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      tooltip: 'Reward multiplier that increases your GRID and dApp token earnings. Rarer NFTs provide higher multipliers.',
    },
    { 
      id: 'feeReduction', 
      label: 'Fee Reduction', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tooltip: 'Percentage reduction applied to transaction fees. Rarer NFTs provide greater fee savings on all dApp interactions.',
    },
    { 
      id: 'costReduction', 
      label: 'Cost Reduction', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      tooltip: 'Percentage reduction applied to transaction costs (base KAS amount). Rarer NFTs provide greater cost savings on all dApp interactions.',
    },
    { 
      id: 'points', 
      label: 'Points', 
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      tooltip: 'NFT points earned per NFT owned. These points contribute to your overall XP and help you level up in the ecosystem.',
    },
  ];

  const getCellValue = (nftType: typeof nftTypes[0], rowId: string) => {
    switch (rowId) {
      case 'count':
        return nftType.count;
      case 'requirements':
        return nftType.requirement;
      case 'multiplier':
        return `+${nftType.multiplier}x`;
      case 'feeReduction':
        return nftType.feeReduction === 100 ? 'Zero Fee' : `-${nftType.feeReduction}%`;
      case 'costReduction':
        return `-${nftType.costReduction}%`;
      case 'points':
        return `${nftType.points} ${nftType.points === 1 ? 'point' : 'points'}`;
      default:
        return '-';
    }
  };

  // Determine which columns to highlight based on ownership
  // Users can own multiple types, so highlight all that apply
  const shouldHighlightColumn = (nftType: typeof nftTypes[0]) => {
    if (nftType.id === 'regular') {
      // Highlight if user has regular NFTs (even if they also have diamond/rarest)
      return regularCount > 0;
    } else if (nftType.id === 'diamond') {
      // Highlight if user has diamond NFTs (even if they also have rarest)
      return diamondCount > 0;
    } else if (nftType.id === 'rarest') {
      // Highlight if user has rarest NFT
      return rarestCount > 0;
    }
    return false;
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
              {nftTypes.map((nftType) => {
                const shouldHighlight = shouldHighlightColumn(nftType);
                return (
                  <th
                    key={nftType.id}
                    className={`border-b border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 text-center ${
                      shouldHighlight ? 'bg-[#02abb8]/5 dark:bg-[#02abb8]/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">{nftType.icon}</span>
                      <span>{nftType.name}</span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-normal flex items-center justify-center gap-1">
                      {shouldHighlight ? (
                        <>
                          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-600 dark:text-green-400">Owned</span>
                        </>
                      ) : (
                        <span className="text-zinc-400">Not Owned</span>
                      )}
                    </div>
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
                {nftTypes.map((nftType) => {
                  const value = getCellValue(nftType, row.id);
                  const shouldHighlight = shouldHighlightColumn(nftType);
                  
                  return (
                    <td
                      key={nftType.id}
                      className={`border-r border-zinc-200/50 dark:border-zinc-700/50 py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 text-center ${
                        shouldHighlight ? 'bg-[#02abb8]/3 dark:bg-[#02abb8]/5' : ''
                      }`}
                    >
                      {row.id === 'count' ? (
                        (typeof value === 'number' && value > 0) ? (
                          <span className={`font-medium ${
                            nftType.id === 'regular' ? 'text-green-600 dark:text-green-400' :
                            nftType.id === 'diamond' ? 'text-purple-600 dark:text-purple-400' :
                            nftType.id === 'rarest' ? 'text-yellow-600 dark:text-yellow-400' :
                            ''
                          }`}>
                            {nftType.id === 'diamond' && '💎 '}
                            {value}
                          </span>
                        ) : (
                          <span className="text-zinc-400">0</span>
                        )
                      ) : (
                        <span className={shouldHighlight ? '' : 'text-zinc-400'}>
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
            onClick={() => setShowNFTBuyWizard(true)}
            className="px-4 py-2 w-auto max-w-[150px] bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors text-sm"
          >
            Buy NFT
          </button>
          <div className="flex items-center justify-end">
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                Your NFT Balance
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {totalCount > 0 ? `${totalCount} NFT${totalCount !== 1 ? 's' : ''}` : '-'}
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
