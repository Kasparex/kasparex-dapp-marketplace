'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { KREX_TIERS, NFT_MULTIPLIER, DIAMOND_NFT_MULTIPLIER, RAREST_NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_FEE_REDUCTION } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { getMockWalletHoldings } from '@/lib/rewards/mockData';
import { getPartnerCollections } from '@/lib/nft/collections';
import { NFT_POINTS } from '@/lib/nft/points';
import { KREXBuyWizard } from './KREXBuyWizard';
import { NFTBuyWizard } from './NFTBuyWizard';

// Mock node status (replace with real hook when available)
const mockNodeStatus = {
  hasLightNode: false,
  hasMirrorNode: false,
  lightNodeConnected: false,
  mirrorNodeConnected: false,
};

const NODE_TYPES = {
  light: { name: 'Light Node', multiplier: 4, feeReduction: 0.1 },
  mirror: { name: 'Mirror Node', multiplier: 5, feeReduction: 0.2 },
};

export function UnifiedStatusBox() {
  const { address, isConnected } = useAccount();
  const { balance, l1Balance, l2Balance, tier: krexTier, isLoading: isKREXLoading } = useKREXBalance();
  const { nftStatus, nftPoints, isLoading: isNFTLoading } = useNFTStatus();
  const holdings = isConnected && address ? getMockWalletHoldings(address) : null;

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

  // NFT multiplier calculation
  let nftMultiplier = 1;
  if (hasRarestNFT) {
    nftMultiplier += RAREST_NFT_MULTIPLIER; // +5x
  } else if (hasDiamondNFT) {
    nftMultiplier += DIAMOND_NFT_MULTIPLIER; // +3x
  } else if (hasAnyNFT) {
    nftMultiplier += NFT_MULTIPLIER; // +1x
  }

  // Node multiplier
  const activeNodeType = mockNodeStatus.hasMirrorNode ? 'mirror' : mockNodeStatus.hasLightNode ? 'light' : null;
  const nodeConfig = activeNodeType ? NODE_TYPES[activeNodeType] : null;
  const nodeMultiplier = nodeConfig?.multiplier || 1;

  // Total multiplier
  const totalMultiplier = krexMultiplier * nftMultiplier * nodeMultiplier;

  // Fee calculation
  let feePercent = krexTierConfig.feePercent;
  if (hasRarestNFT) {
    feePercent = Math.max(0, feePercent - RAREST_NFT_FEE_REDUCTION); // Zero fee
  } else if (hasDiamondNFT) {
    feePercent = Math.max(0, feePercent - DIAMOND_NFT_FEE_REDUCTION);
  } else if (hasAnyNFT) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }
  if (nodeConfig) {
    feePercent = Math.max(0, feePercent - nodeConfig.feeReduction);
  }

  // Modal states
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showKREXBuyWizard, setShowKREXBuyWizard] = useState(false);
  const [showNFTBuyWizard, setShowNFTBuyWizard] = useState(false);

  const isLoading = isKREXLoading || isNFTLoading;

  return (
    <>
      <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Rewards Status
          </h3>
          <div className="flex items-center gap-2">
            {isConnected && !isLoading && (
              <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                Active
              </span>
            )}
            <button
              onClick={() => setShowRewardsModal(true)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              aria-label="View rewards details"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
            Loading status...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Section with Points merged */}
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="grid grid-cols-3 gap-4 mb-2">
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Total Multiplier</div>
                  <div className="text-lg font-bold text-[#02abb8]">{totalMultiplier}x</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Fee</div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{feePercent.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">XP Points</div>
                  <div className="text-lg font-bold text-[#02abb8]">
                    {holdings ? formatLargeNumber(holdings.xp) : '—'}
                  </div>
                </div>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                KREX {krexMultiplier}x
                {nftMultiplier > 1 && ` × NFT +${nftMultiplier - 1}x`}
                {nodeMultiplier > 1 && ` × Node +${nodeMultiplier - 1}x`}
              </div>
            </div>

            {/* KREX Section */}
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">KREX Status</h4>
                  <span className="text-xs px-1.5 py-0.5 bg-[#02abb8]/10 text-[#02abb8] rounded">
                    {krexTierConfig.label}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">KREX L1 (Kaspa)</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatLargeNumber(l1Balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">KREX L2 (Kasplex)</span>
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
                  <span className="text-zinc-500 dark:text-zinc-400">{krexTierConfig.feePercent}%</span>
                </div>
              </div>
            </div>

            {/* NFT Section - Match existing NFTStatusBox exactly */}
            <div className="pb-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">NFT Status</h4>
                  {hasAnyNFT && (
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                      Active
                    </span>
                  )}
                </div>
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
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">NODE Status</h4>
                  {activeNodeType && (activeNodeType === 'mirror' ? mockNodeStatus.mirrorNodeConnected : mockNodeStatus.lightNodeConnected) && (
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                      Active
                    </span>
                  )}
                  {activeNodeType && !(activeNodeType === 'mirror' ? mockNodeStatus.mirrorNodeConnected : mockNodeStatus.lightNodeConnected) && (
                    <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full">
                      Disconnected
                    </span>
                  )}
                </div>
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
                        (activeNodeType === 'mirror' ? mockNodeStatus.mirrorNodeConnected : mockNodeStatus.lightNodeConnected)
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {(activeNodeType === 'mirror' ? mockNodeStatus.mirrorNodeConnected : mockNodeStatus.lightNodeConnected) ? 'Connected' : 'Disconnected'}
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
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 gap-2">
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
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Points Multiplier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(KREX_TIERS).map((tier) => {
                        const isUserTier = tier.tier === krexTier;
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
                              {tier.minKREX === 0 ? '< 10M' : `≥ ${formatLargeNumber(tier.minKREX)}`}
                            </td>
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">{tier.multiplier}x</td>
                            <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{tier.feePercent}%</td>
                            <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">{tier.pointsMultiplier}x</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
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
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
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
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
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
              </div>

              {/* XP Points Table */}
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">XP Points</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Points Earned</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          dApp Usage
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                          100 XP
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                          Per 1 KAS spent on dApp transactions
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Wizards */}
      <KREXBuyWizard isOpen={showKREXBuyWizard} onClose={() => setShowKREXBuyWizard(false)} />
      <NFTBuyWizard isOpen={showNFTBuyWizard} onClose={() => setShowNFTBuyWizard(false)} />
    </>
  );
}
