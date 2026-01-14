'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { createPortal } from 'react-dom';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { KREX_TIERS, NFT_MULTIPLIER, DIAMOND_NFT_MULTIPLIER, RAREST_NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_FEE_REDUCTION } from '@/lib/rewards/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { getMockWalletHoldings } from '@/lib/rewards/mockData';
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
  light: { name: 'Light Node', multiplier: 4.0, feeReduction: 0.1 },
  mirror: { name: 'Mirror Node', multiplier: 5.0, feeReduction: 0.2 },
};

export function UnifiedStatusBox() {
  const { address, isConnected } = useAccount();
  const { balance, l1Balance, l2Balance, tier: krexTier, isLoading: isKREXLoading } = useKREXBalance();
  const { nftStatus, nftPoints, isLoading: isNFTLoading } = useNFTStatus();
  const holdings = isConnected && address ? getMockWalletHoldings(address) : null;

  // Calculate multipliers
  const krexTierConfig = KREX_TIERS[krexTier];
  const krexMultiplier = krexTierConfig.multiplier;

  // NFT multiplier calculation
  const hasRegularNFT = nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX || false;
  const hasDiamondNFT = nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX || false;
  const hasRarestNFT = nftStatus?.hasRarestNFT || false;
  
  let nftMultiplier = 1;
  if (hasRarestNFT) {
    nftMultiplier += RAREST_NFT_MULTIPLIER; // +5x
  } else if (hasDiamondNFT) {
    nftMultiplier += DIAMOND_NFT_MULTIPLIER; // +3x
  } else if (hasRegularNFT) {
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
  } else if (hasRegularNFT) {
    feePercent = Math.max(0, feePercent - NFT_FEE_REDUCTION);
  }
  if (nodeConfig) {
    feePercent = Math.max(0, feePercent - nodeConfig.feeReduction);
  }

  // Modal states
  const [showKREXModal, setShowKREXModal] = useState(false);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showKREXBuyWizard, setShowKREXBuyWizard] = useState(false);
  const [showNFTBuyWizard, setShowNFTBuyWizard] = useState(false);

  const isLoading = isKREXLoading || isNFTLoading;

  return (
    <>
      <div className="mb-6 p-4 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Rewards Status
          </h3>
          <div className="flex items-center gap-2">
            {isConnected && !isLoading && (
              <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full font-medium">
                Active
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 py-4 text-center">
            Loading status...
          </div>
        ) : (
          <>
            {/* Summary Section */}
            <div className="mb-4 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Multiplier</div>
                  <div className="text-lg font-bold text-[#02abb8]">{totalMultiplier.toFixed(1)}x</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Fee</div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{feePercent.toFixed(2)}%</div>
                </div>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Breakdown: KREX {krexMultiplier}x
                  {nftMultiplier > 1 && ` × NFT ${nftMultiplier.toFixed(1)}x`}
                  {nodeMultiplier > 1 && ` × Node ${nodeMultiplier.toFixed(1)}x`}
                </div>
              </div>
            </div>

            {/* KREX Section */}
            <div className="mb-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">KREX</span>
                  <span className="text-xs px-1.5 py-0.5 bg-[#02abb8]/10 text-[#02abb8] rounded">
                    {krexTierConfig.label}
                  </span>
                </div>
                <button
                  onClick={() => setShowKREXModal(true)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
                  aria-label="View KREX details"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">L1 (Kaspa)</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatLargeNumber(l1Balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">L2 (Kasplex)</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatLargeNumber(l2Balance)}</span>
                </div>
                <div className="pt-1 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Total</span>
                  <span className="font-bold text-[#02abb8]">{formatLargeNumber(balance)}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Multiplier</span>
                  <span>{krexMultiplier}x</span>
                </div>
              </div>
            </div>

            {/* NFT Section */}
            <div className="mb-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">NFT</span>
                  {hasRarestNFT && (
                    <span className="text-xs px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded">
                      ⭐ Rarest
                    </span>
                  )}
                  {!hasRarestNFT && hasDiamondNFT && (
                    <span className="text-xs px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded">
                      💎 Diamond
                    </span>
                  )}
                  {!hasRarestNFT && !hasDiamondNFT && hasRegularNFT && (
                    <span className="text-xs px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded">
                      🖼️ Active
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNFTModal(true)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
                  aria-label="View NFT details"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">KREXPRIME</span>
                  <span className={nftStatus?.hasKREXPRIME ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                    {nftStatus?.hasKREXPRIME ? '✓' : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">PIXELKREX</span>
                  <span className={nftStatus?.hasPIXELKREX ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                    {nftStatus?.hasPIXELKREX ? '✓' : '—'}
                  </span>
                </div>
                <div className="pt-1 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Multiplier</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{nftMultiplier.toFixed(1)}x</span>
                </div>
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span>Points</span>
                  <span>{nftPoints}</span>
                </div>
              </div>
            </div>

            {/* Node Section */}
            <div className="mb-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Node</span>
                  {activeNodeType && (
                    <span className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">
                      {nodeConfig?.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowNodeModal(true)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
                  aria-label="View Node details"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1 text-xs">
                {activeNodeType ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Type</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{nodeConfig?.name}</span>
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
                    <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Multiplier</span>
                      <span>{nodeMultiplier.toFixed(1)}x</span>
                    </div>
                  </>
                ) : (
                  <div className="text-zinc-500 dark:text-zinc-400 text-center py-1">
                    No active node
                  </div>
                )}
              </div>
            </div>

            {/* Points Section */}
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Points</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">XP Balance</span>
                  <span className="text-lg font-bold text-[#02abb8]">
                    {holdings ? formatLargeNumber(holdings.xp) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span>NFT Points</span>
                  <span>{nftPoints}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2">
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
          </>
        )}
      </div>

      {/* KREX Details Modal */}
      {showKREXModal && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowKREXModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">KREX Requirements</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">KREX holders unlock tiered rewards</p>
              </div>
              <button
                onClick={() => setShowKREXModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold">Tier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Requirement</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Multiplier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(KREX_TIERS).map((tier) => {
                      const isUserTier = tier.tier === krexTier;
                      return (
                        <tr
                          key={tier.tier}
                          className={`border-b border-zinc-100 dark:border-zinc-800 ${
                            isUserTier ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-sm font-medium">
                            {tier.label}
                            {isUserTier && <span className="ml-2 text-xs text-[#02abb8]">(Current)</span>}
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                            {tier.minKREX === 0 ? '< 10M' : `≥ ${formatLargeNumber(tier.minKREX)}`}
                          </td>
                          <td className="py-3 px-4 text-sm">{tier.multiplier}x</td>
                          <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{tier.feePercent}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* NFT Details Modal */}
      {showNFTModal && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowNFTModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">NFT Rewards</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">NFT holders unlock additional rewards</p>
              </div>
              <button
                onClick={() => setShowNFTModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold">NFT Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Multiplier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Fee Reduction</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 text-sm font-medium">🖼️ Regular NFT</td>
                      <td className="py-3 px-4 text-sm">+{NFT_MULTIPLIER}x</td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">-{NFT_FEE_REDUCTION}%</td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 text-sm font-medium">💎 Diamond NFT</td>
                      <td className="py-3 px-4 text-sm">+{DIAMOND_NFT_MULTIPLIER}x</td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">-{DIAMOND_NFT_FEE_REDUCTION}%</td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 text-sm font-medium">⭐ Rarest NFT</td>
                      <td className="py-3 px-4 text-sm">+{RAREST_NFT_MULTIPLIER}x</td>
                      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">-{RAREST_NFT_FEE_REDUCTION}% (Zero Fee)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Node Details Modal */}
      {showNodeModal && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowNodeModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Node Requirements</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Run a KREX Node to unlock additional rewards</p>
              </div>
              <button
                onClick={() => setShowNodeModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold">Node Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Multiplier</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">Fee Reduction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(NODE_TYPES).map(([key, node]) => (
                      <tr key={key} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-3 px-4 text-sm font-medium">{node.name}</td>
                        <td className="py-3 px-4 text-sm">{node.multiplier}x</td>
                        <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">{node.feeReduction}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
