'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { KREX_TIERS, NFT_MULTIPLIER, DIAMOND_NFT_MULTIPLIER, RAREST_NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_FEE_REDUCTION, NFT_COST_REDUCTION, DIAMOND_NFT_COST_REDUCTION, RAREST_NFT_COST_REDUCTION, LIGHT_NODE_COST_REDUCTION, MIRROR_NODE_COST_REDUCTION } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { getPartnerCollections } from '@/lib/nft/collections';
import { NFT_POINTS } from '@/lib/nft/points';
import { isDiamondNFT } from '@/lib/nft/diamond-detection';
import { fetchMultipleNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import { KREXBuyWizard } from './KREXBuyWizard';
import { NFTBuyWizard } from './NFTBuyWizard';
import { NodeSetupWizard } from './NodeSetupWizard';
import { TierBadge } from './TierBadge';
import Link from 'next/link';
import { TokenLogoImage } from '@/components/ui/TokenLogoImage';

// Mock node status (replace with real hook when available)
const mockNodeStatus = {
  hasLightNode: false,
  hasEdgeNode: false,
  lightNodeConnected: false,
  edgeNodeConnected: false,
};

const NODE_TYPES = {
  light: { name: 'Light Node', multiplier: 4, feeReduction: 0.1, costReduction: LIGHT_NODE_COST_REDUCTION },
  edge: { name: 'Edge Node', multiplier: 5, feeReduction: 0.2, costReduction: MIRROR_NODE_COST_REDUCTION },
};

export function UnifiedStatusBox() {
  const { address, isConnected } = useAccount();
  const { balance, l1Balance, l2Balance, tier: krexTier, isLoading: isKREXLoading } = useKREXBalance();
  const { nftStatus, nfts, nftPoints, isLoading: isNFTLoading } = useNFTStatus();
  const { totalRedeemable: hubPts } = useRedeemablePointsBreakdown();

  // Use real NFT status if available, otherwise use empty status
  const status = nftStatus || {
    hasKREXPRIME: false,
    hasPIXELKREX: false,
    hasDiamondKREXPRIME: false,
    hasDiamondPIXELKREX: false,
    hasRarestNFT: false,
    partnerCollections: {},
    partnerDiamonds: {},
  };

  const hasAnyNFT = status.hasKREXPRIME || status.hasPIXELKREX || 
    (status.partnerCollections && Object.values(status.partnerCollections).some(v => v));
  const hasDiamondNFT = status.hasDiamondKREXPRIME || status.hasDiamondPIXELKREX ||
    (status.partnerDiamonds && Object.values(status.partnerDiamonds).some(v => v));
  const hasRarestNFT = status.hasRarestNFT;
  const partnerCollections = getPartnerCollections();

  // Calculate multipliers
  const krexTierConfig = KREX_TIERS[krexTier];
  const krexMultiplier = krexTierConfig.multiplier;

  // NFT multiplier calculation (additive, not multiplicative)
  let nftMultiplierAdd = 0;
  if (hasRarestNFT) {
    nftMultiplierAdd = RAREST_NFT_MULTIPLIER; // +5x
  } else if (hasDiamondNFT) {
    nftMultiplierAdd = DIAMOND_NFT_MULTIPLIER; // +3x
  } else if (hasAnyNFT) {
    nftMultiplierAdd = NFT_MULTIPLIER; // +1x
  }

  // Node multiplier (additive, not multiplicative)
  const activeNodeType = mockNodeStatus.hasEdgeNode ? 'edge' : mockNodeStatus.hasLightNode ? 'light' : null;
  const nodeConfig = activeNodeType ? NODE_TYPES[activeNodeType] : null;
  const nodeMultiplierAdd = nodeConfig ? (nodeConfig.multiplier - 1) : 0; // e.g., 4x becomes +3x

  // Total multiplier (additive: KREX base + NFT bonus + Node bonus)
  const totalMultiplier = krexMultiplier + nftMultiplierAdd + nodeMultiplierAdd;

  // Fee calculation with base fee
  const baseFee = 1.0; // Default base fee
  let feePercent = baseFee;
  
  // Apply tier-based fee reduction (like NFT fee reductions)
  feePercent = Math.max(0, feePercent - krexTierConfig.feeReduction);
  
  // Apply NFT fee reductions (stack with tier reduction)
  if (hasRarestNFT) {
    feePercent = 0; // Zero fee
  } else if (hasDiamondNFT) {
    feePercent = Math.max(0, feePercent - DIAMOND_NFT_FEE_REDUCTION);
  } else if (hasAnyNFT) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }
  if (nodeConfig) {
    feePercent = Math.max(0, feePercent - nodeConfig.feeReduction);
  }
  
  // Calculate fee reduction for display
  const hasFeeReduction = feePercent < baseFee;

  // Calculate cost reduction (transaction cost reduction)
  let costReductionPercent = krexTierConfig.costReduction;
  // Stack NFT cost reductions
  if (hasRarestNFT) {
    costReductionPercent += RAREST_NFT_COST_REDUCTION;
  } else if (hasDiamondNFT) {
    costReductionPercent += DIAMOND_NFT_COST_REDUCTION;
  } else if (hasAnyNFT) {
    costReductionPercent += NFT_COST_REDUCTION;
  }
  // Stack node cost reductions
  if (nodeConfig) {
    costReductionPercent += (activeNodeType === 'edge' ? MIRROR_NODE_COST_REDUCTION : LIGHT_NODE_COST_REDUCTION);
  }
  // Cap at 50%
  costReductionPercent = Math.min(50, costReductionPercent);

  // Calculate NFT counts per collection
  const nftCountsByCollection = nfts?.reduce((acc, nft) => {
    acc[nft.collection] = (acc[nft.collection] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Count regular NFTs (KREXPRIME or PIXELKREX, non-diamond)
  const regularNFTCount = (nftCountsByCollection['KREXPRIME'] || 0) + (nftCountsByCollection['PIXELKREX'] || 0);
  
  // Total NFT count (all collections)
  const totalNFTCount = Object.values(nftCountsByCollection).reduce((sum, count) => sum + count, 0);
  
  // Get all collections (main + partner) for the detailed table
  const allCollections = [
    { id: 'KREXPRIME', name: 'KREXPRIME', isPartner: false },
    { id: 'PIXELKREX', name: 'PIXELKREX', isPartner: false },
    ...getPartnerCollections().map(coll => ({ id: coll.id, name: coll.partnerName || coll.name, isPartner: true })),
  ];

  // Calculate diamond, regular, and rarest counts per collection
  const [diamondCountsByCollection, setDiamondCountsByCollection] = useState<Record<string, number>>({});
  const [regularCountsByCollection, setRegularCountsByCollection] = useState<Record<string, number>>({});
  const [rarestCountsByCollection, setRarestCountsByCollection] = useState<Record<string, number>>({});
  
  // Helper function to check if NFT is rarest
  const isRareNFT = (collectionId: string, tokenId: number): boolean => {
    const RARE_NFT_IDS: Record<string, number[]> = {
      KREXPRIME: [345],
      PIXELKREX: [515],
    };
    const rareIds = RARE_NFT_IDS[collectionId];
    return rareIds ? rareIds.includes(tokenId) : false;
  };
  
  useEffect(() => {
    if (!nfts || nfts.length === 0) {
      setDiamondCountsByCollection({});
      setRegularCountsByCollection({});
      setRarestCountsByCollection({});
      return;
    }

    const calculateCounts = async () => {
      const diamondCounts: Record<string, number> = {};
      const regularCounts: Record<string, number> = {};
      const rarestCounts: Record<string, number> = {};
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

      // Count diamonds, regular, and rarest per collection
      nfts.forEach((nft) => {
        const metadataKey = `${nft.collection}-${nft.tokenId}`;
        const metadata = metadataMap.get(metadataKey) || null;
        const isDiamond = isDiamondNFT(nft.collection, metadata);
        const isRarest = isRareNFT(nft.collection, nft.tokenId);
        
        if (isRarest) {
          rarestCounts[nft.collection] = (rarestCounts[nft.collection] || 0) + 1;
        } else if (isDiamond) {
          diamondCounts[nft.collection] = (diamondCounts[nft.collection] || 0) + 1;
        } else {
          regularCounts[nft.collection] = (regularCounts[nft.collection] || 0) + 1;
        }
      });

      setDiamondCountsByCollection(diamondCounts);
      setRegularCountsByCollection(regularCounts);
      setRarestCountsByCollection(rarestCounts);
    };

    calculateCounts();
  }, [nfts]);

  // Modal states
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showKREXBuyWizard, setShowKREXBuyWizard] = useState(false);
  const [showNFTBuyWizard, setShowNFTBuyWizard] = useState(false);
  const [showNodeWizard, setShowNodeWizard] = useState(false);

  const isLoading = isKREXLoading || isNFTLoading;

  return (
    <>
      <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TokenLogoImage tokenId="kas" size={18} />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Rewards Status
            </h3>
          </div>
          {isConnected && !isLoading && (
            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
              Active
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
            Loading status...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Section with Points merged */}
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Total Multiplier</div>
                  <div className="text-lg font-bold text-[#02abb8]">{totalMultiplier}x</div>
                </div>
                  <div className="text-right">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Hub pts</div>
                  <div className="text-lg font-bold text-[#02abb8]">
                    {formatLargeNumber(hubPts)}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Current Fee</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {hasFeeReduction ? (
                    <>
                      <span className="line-through text-zinc-400 mr-2">{baseFee.toFixed(2)}%</span>
                      <span className="text-green-600 dark:text-green-400">{feePercent.toFixed(2)}%</span>
                    </>
                  ) : (
                    `${feePercent.toFixed(2)}%`
                  )}
                </span>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowRewardsModal(true)}
                  className="w-full px-4 py-2 text-sm font-medium bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg transition-colors"
                >
                  View Rewards Details
                </button>
              </div>
            </div>

            {/* KREX Section */}
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TokenLogoImage tokenId="krex" size={18} />
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">KREX Status</h4>
                </div>
                <TierBadge tier={krexTier} isUnlocked={balance > 0} />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">KREX L1 Balance</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatLargeNumber(l1Balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">KREX L2 Balance</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatLargeNumber(l2Balance)}</span>
                </div>
                <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Total KREX</span>
                  <span className="font-bold text-[#02abb8]">{formatLargeNumber(balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Multiplier</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{krexMultiplier}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Fee</span>
                  <span className="text-zinc-500 dark:text-zinc-400">-{krexTierConfig.feeReduction}%</span>
                </div>
              </div>
            </div>

            {/* NFT Section - Match existing NFTStatusBox exactly */}
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">NFT Status</h4>
                {hasAnyNFT && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">KREXPRIME:</span>
                  <span className={status.hasKREXPRIME ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                    {status.hasKREXPRIME ? '✓ Owned' : 'Not owned'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">PIXELKREX:</span>
                  <span className={status.hasPIXELKREX ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                    {status.hasPIXELKREX ? '✓ Owned' : 'Not owned'}
                  </span>
                </div>
                {/* Partner Collections */}
                {partnerCollections.length > 0 && status.partnerCollections && (
                  <>
                    {partnerCollections.map((partnerColl) => {
                      const hasPartnerNFT = status.partnerCollections![partnerColl.id] || false;
                      const hasPartnerDiamond = status.partnerDiamonds?.[partnerColl.id] || false;
                      return (
                        <div key={partnerColl.id} className="flex items-center justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {partnerColl.partnerName || partnerColl.name}:
                          </span>
                          <span className={hasPartnerNFT ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                            {hasPartnerNFT ? (
                              hasPartnerDiamond ? '✓ 💎 Diamond' : '✓ Owned'
                            ) : 'Not owned'}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">🖼️ Regular NFT:</span>
                  <span className={hasAnyNFT ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-zinc-400'}>
                    {hasAnyNFT ? '✓ Owned' : 'Not owned'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">💎 Diamond:</span>
                  <span className={hasDiamondNFT ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-zinc-400'}>
                    {hasDiamondNFT ? '✓ Owned' : 'Not owned'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">⭐ Rarest:</span>
                  <span className={hasRarestNFT ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-zinc-400'}>
                    {hasRarestNFT ? '✓ Owned' : 'Not owned'}
                  </span>
                </div>
                {hasAnyNFT && (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1">
                    {hasRarestNFT ? (
                      <div><span className="text-yellow-600 dark:text-yellow-400 font-medium">+{RAREST_NFT_MULTIPLIER}x multiplier, 0.0% fee, +{nftPoints} points</span></div>
                    ) : hasDiamondNFT ? (
                      <div><span className="text-purple-600 dark:text-purple-400 font-medium">+{DIAMOND_NFT_MULTIPLIER}x multiplier, -{DIAMOND_NFT_FEE_REDUCTION}% fee, +{nftPoints} points</span></div>
                    ) : (
                      <div><span className="text-green-600 dark:text-green-400 font-medium">+{NFT_MULTIPLIER}x multiplier, -{NFT_FEE_REDUCTION}% fee, +{nftPoints} points</span></div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Node Section */}
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">NODE Status</h4>
                {activeNodeType && (activeNodeType === 'edge' ? mockNodeStatus.edgeNodeConnected : mockNodeStatus.lightNodeConnected) && (
                  <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                    Active
                  </span>
                )}
                {activeNodeType && !(activeNodeType === 'edge' ? mockNodeStatus.edgeNodeConnected : mockNodeStatus.lightNodeConnected) && (
                  <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full">
                    Disconnected
                  </span>
                )}
              </div>
              <div className="space-y-1.5 text-xs">
                {activeNodeType && nodeConfig ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Node Type</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{nodeConfig.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Multiplier</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">+{nodeConfig.multiplier - 1}x</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Fee Reduction</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{nodeConfig.feeReduction}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Status</span>
                      <span className={`font-medium ${
                        (activeNodeType === 'edge' ? mockNodeStatus.edgeNodeConnected : mockNodeStatus.lightNodeConnected)
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {(activeNodeType === 'edge' ? mockNodeStatus.edgeNodeConnected : mockNodeStatus.lightNodeConnected) ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-zinc-500 dark:text-zinc-400">
                    No active node
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowKREXBuyWizard(true)}
                  className="px-3 py-2 text-xs font-medium text-center bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg transition-colors"
                >
                  Buy KREX
                </button>
                <button
                  onClick={() => setShowNFTBuyWizard(true)}
                  className="px-3 py-2 text-xs font-medium text-center bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg transition-colors"
                >
                  Buy NFT
                </button>
              </div>
              <button
                onClick={() => setShowNodeWizard(true)}
                className="w-full px-3 py-2 text-xs font-medium text-center bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg transition-colors"
              >
                Setup Node
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Unified Rewards Modal */}
      {showRewardsModal && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowRewardsModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Rewards</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Complete overview of all reward tiers and multipliers</p>
              </div>
              <button
                onClick={() => setShowRewardsModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-8">
              {/* Current User Status */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Your Current Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">KREX Balance</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatLargeNumber(balance)} ({krexTierConfig.label})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">NFT Status</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {hasRarestNFT ? '⭐ Rarest' : hasDiamondNFT ? '💎 Diamond' : hasAnyNFT ? '🖼️ Regular' : 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Node Status</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {activeNodeType ? nodeConfig?.name : 'Not active'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Hub pts (Kaspa ledger)</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatLargeNumber(hubPts)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Total Multiplier</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalMultiplier}x</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Current Fee</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {hasFeeReduction ? (
                        <>
                          <span className="line-through text-zinc-400 mr-2">{baseFee.toFixed(2)}%</span>
                          <span className="text-green-600 dark:text-green-400">{feePercent.toFixed(2)}%</span>
                        </>
                      ) : (
                        `${feePercent.toFixed(2)}%`
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* KREX Tier Rewards Table */}
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">KREX Tier Rewards</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tier</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Requirement</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Reward Multiplier</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fee</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pts multiplier (L2)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(KREX_TIERS).map((tier) => {
                        const isUserTier = tier.tier === krexTier;
                        const tierHasFeeReduction = isUserTier && hasFeeReduction;
                        return (
                          <tr
                            key={tier.tier}
                            className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                              isUserTier ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                              {tier.label}
                              {isUserTier && <span className="ml-2 text-xs text-[#02abb8] font-medium">(Current)</span>}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                              {tier.minKREX === 0 ? '0 KREX' : `≥ ${formatLargeNumber(tier.minKREX)} KREX`}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">{tier.multiplier}x</td>
                            <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                              -{tier.feeReduction}%
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">{tier.pointsMultiplier}x</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setShowRewardsModal(false);
                      setShowKREXBuyWizard(true);
                    }}
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
                        {isConnected ? (isKREXLoading ? 'Loading...' : formatLargeNumber(balance)) : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NFT Rewards Table */}
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">NFT Rewards</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">NFT Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Reward Multiplier</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fee Reduction</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        hasAnyNFT && !hasDiamondNFT && !hasRarestNFT ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                      }`}>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          🖼️ Regular NFT
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            (KREXPRIME or PIXELKREX)
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                          +{NFT_MULTIPLIER}x
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                          -{NFT_FEE_REDUCTION}%
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          {NFT_POINTS.REGULAR} point
                        </td>
                      </tr>
                      <tr className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        hasDiamondNFT && !hasRarestNFT ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                      }`}>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          💎 Diamond NFT
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            (Any Diamond from any collection)
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                          +{DIAMOND_NFT_MULTIPLIER}x
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                          -{DIAMOND_NFT_FEE_REDUCTION}%
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          {NFT_POINTS.DIAMOND} points
                        </td>
                      </tr>
                      <tr className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        hasRarestNFT ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                      }`}>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          ⭐ Rarest NFT
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            (#515 PIXELKREX or #345 KREXPRIME)
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                          +{RAREST_NFT_MULTIPLIER}x
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                          -{RAREST_NFT_FEE_REDUCTION}% (Zero Fee)
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          {NFT_POINTS.RAREST} points
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* NFT Status Table - Detailed per Collection */}
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">NFT Status</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Collection</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Regular</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Diamonds</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Rarest</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Owned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCollections.map((coll) => {
                        const count = nftCountsByCollection[coll.id] || 0;
                        const regularCount = regularCountsByCollection[coll.id] || 0;
                        const diamondCount = diamondCountsByCollection[coll.id] || 0;
                        const rarestCount = rarestCountsByCollection[coll.id] || 0;
                        const hasNFTs = count > 0;
                        
                        return (
                          <tr
                            key={coll.id}
                            className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                              hasNFTs ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                              {coll.name}
                              {coll.isPartner && (
                                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">(Partner)</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                              {regularCount > 0 ? (
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  {regularCount}
                                </span>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                              {diamondCount > 0 ? (
                                <span className="text-purple-600 dark:text-purple-400 font-medium">
                                  💎 {diamondCount}
                                </span>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                              {rarestCount > 0 ? (
                                <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                  ⭐ {rarestCount}
                                </span>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                              {hasNFTs ? (
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  {count} NFT{count !== 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setShowRewardsModal(false);
                      setShowNFTBuyWizard(true);
                    }}
                    className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                  >
                    Buy NFT
                  </button>
                  <div className="flex items-center justify-end">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                        Your NFT Balance
                      </div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {isConnected ? (isNFTLoading ? 'Loading...' : `${totalNFTCount} NFT${totalNFTCount !== 1 ? 's' : ''}`) : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Node Rewards Table */}
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Node Rewards</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Node Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Requirements</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Reward Multiplier</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fee Reduction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(NODE_TYPES).map(([key, node]) => {
                        const isUserNode = activeNodeType === key;
                        return (
                          <tr
                            key={key}
                            className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                              isUserNode ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                              {node.name}
                              {isUserNode && <span className="ml-2 text-xs text-[#02abb8] font-medium">(Active)</span>}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                              Run a {node.name}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                              +{node.multiplier - 1}x
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                              {node.feeReduction}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowRewardsModal(false);
                      setShowNodeWizard(true);
                    }}
                    className="w-full px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                  >
                    Setup Node
                  </button>
                </div>
              </div>

              {/* Hub redeemable pts (Rewards wallet + Minecore refinement) */}
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Hub redeemable pts</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Typical pts</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Where</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">Qualified dApp usage</td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          {HUB_EARN_POINTS.dappL1Interaction} pts
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">Kaspa-classified interactions</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">Minecore refine</td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">Varies</td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">Gameplay bucket on this device</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                  Full table:{' '}
                  <Link href="/rewards#rewards-points" className="text-[#02abb8] hover:underline font-medium">
                    Rewards → Points
                  </Link>
                  .
                </p>
              </div>

              {/* View More Button */}
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <Link
                  href="/tiers"
                  onClick={() => setShowRewardsModal(false)}
                  className="w-full px-6 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span>View more</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Wizards */}
      <KREXBuyWizard isOpen={showKREXBuyWizard} onClose={() => setShowKREXBuyWizard(false)} />
      <NFTBuyWizard isOpen={showNFTBuyWizard} onClose={() => setShowNFTBuyWizard(false)} />
      
      {/* Node Setup Wizard */}
      <NodeSetupWizard isOpen={showNodeWizard} onClose={() => setShowNodeWizard(false)} />
    </>
  );
}
