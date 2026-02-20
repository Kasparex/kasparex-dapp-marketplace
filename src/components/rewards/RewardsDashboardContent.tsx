'use client';

import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getMockWalletHoldings } from '@/lib/rewards/mockData';
import { getChainById } from '@/lib/wagmi';
import { isTestMode } from '@/lib/network/testModeCore';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { type UserRewardStatus } from '@/lib/rewards/dashboard-data';
import { KREX_TIERS, NFT_MULTIPLIER, DIAMOND_NFT_MULTIPLIER, RAREST_NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, NFT_COST_REDUCTION, DIAMOND_NFT_COST_REDUCTION, RAREST_NFT_COST_REDUCTION, LIGHT_NODE_COST_REDUCTION, MIRROR_NODE_COST_REDUCTION } from '@/lib/rewards/types';
import { TierRewardsTable } from './TierRewardsTable';
import { NFTRewardsTable } from './NFTRewardsTable';
import { NodeRewardsTable } from './NodeRewardsTable';
import { PremiumRewardsTable } from './PremiumRewardsTable';
import { TierBadge } from './TierBadge';
import { KREXBuyWizard } from './KREXBuyWizard';
import { NFTBuyWizard } from './NFTBuyWizard';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface RewardsDashboardContentProps {
  filters: {
    types: ('krex-tier' | 'nft' | 'node' | 'premium')[];
    status: ('unlocked' | 'locked')[];
  };
  searchQuery: string;
}

export function RewardsDashboardContent({
  filters,
  searchQuery,
}: RewardsDashboardContentProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { balance: krexBalance, l1Balance, l2Balance, tier: krexTier, isLoading: isKREXLoading } = useKREXBalance();
  const { nftStatus, nftPoints, isLoading: isNFTLoading } = useNFTStatus();
  const holdings = isConnected && address ? getMockWalletHoldings(address) : null;
  const [showKREXBuyWizard, setShowKREXBuyWizard] = useState(false);
  const [showNFTBuyWizard, setShowNFTBuyWizard] = useState(false);

  const chain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);
  const isTestnet = isTestMode(chain);
  const gridTokenAddress = useMemo(() => {
    if (isTestnet) {
      const tgrid = getContractAddress(chainId, 'tGRID');
      if (tgrid) return tgrid;
    }
    return getContractAddress(chainId, 'GRIDToken') || null;
  }, [chainId, isTestnet]);
  const { formattedBalance: gridFormattedBalance, isLoading: isGRIDLoading } = useGRIDToken(gridTokenAddress);


  const isLoading = isKREXLoading || isNFTLoading || isGRIDLoading;
  
  const defaultNFTStatus = {
    hasKREXPRIME: false,
    hasPIXELKREX: false,
    hasDiamondKREXPRIME: false,
    hasDiamondPIXELKREX: false,
    hasRarestNFT: false,
    partnerCollections: {},
    partnerDiamonds: {},
  };

  return (
    <div className="space-y-8">
      {/* Dashboard & Rewards */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
          Dashboard & Rewards
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* KREX Balance Card */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              KREX Token
            </h3>
            {isKREXLoading ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">L1 Balance</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatLargeNumber(l1Balance || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">L2 Balance</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatLargeNumber(l2Balance || 0)}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Total KREX</span>
                  <span className="font-bold text-[#02abb8] text-lg">
                    {formatLargeNumber(krexBalance || 0)}
                  </span>
                </div>
                {krexBalance > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Current Tier</span>
                    <TierBadge tier={krexTier} isUnlocked={krexBalance > 0} />
                  </div>
                )}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                  <button
                    onClick={() => setShowKREXBuyWizard(true)}
                    className="flex-1 px-3 py-1.5 text-xs bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                  >
                    Buy KREX
                  </button>
                  <button
                    onClick={() => setShowNFTBuyWizard(true)}
                    className="flex-1 px-3 py-1.5 text-xs bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
                  >
                    Buy NFT
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Multiplier Box */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Multipliers
            </h3>
            <div className="space-y-2 text-sm">
              {(() => {
                // If no KREX, multiplier is 0x
                const hasKREX = krexBalance > 0;
                const krexTierConfig = KREX_TIERS[krexTier];
                const krexMultiplier = hasKREX ? krexTierConfig.multiplier : 0;
                
                // Calculate NFT multiplier
                const hasAnyNFT = !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX ||
                  (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some(v => v)));
                const hasDiamondNFT = !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ||
                  (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some(v => v)));
                const hasRarestNFT = !!nftStatus?.hasRarestNFT;
                
                let nftMultiplierAdd = 0;
                if (hasRarestNFT) {
                  nftMultiplierAdd = RAREST_NFT_MULTIPLIER;
                } else if (hasDiamondNFT) {
                  nftMultiplierAdd = DIAMOND_NFT_MULTIPLIER;
                } else if (hasAnyNFT) {
                  nftMultiplierAdd = NFT_MULTIPLIER;
                }
                
                // Mock node status (same as UnifiedStatusBox)
                const mockNodeStatus = { hasLightNode: false, hasMirrorNode: false };
                const NODE_TYPES = {
                  light: { multiplier: 4 },
                  mirror: { multiplier: 5 },
                };
                const activeNodeType = mockNodeStatus.hasMirrorNode ? 'mirror' : mockNodeStatus.hasLightNode ? 'light' : null;
                const nodeConfig = activeNodeType ? NODE_TYPES[activeNodeType] : null;
                const nodeMultiplierAdd = nodeConfig ? (nodeConfig.multiplier - 1) : 0;
                
                const totalMultiplier = krexMultiplier + nftMultiplierAdd + nodeMultiplierAdd;
                
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">KREX Tier</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {krexMultiplier}x
                      </span>
                    </div>
                    {nftMultiplierAdd > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">NFT Bonus</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          +{nftMultiplierAdd}x
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">NODE Bonus</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {nodeMultiplierAdd > 0 ? `+${nodeMultiplierAdd}x` : '0x'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Total</span>
                      <span className="font-bold text-[#02abb8] text-lg">
                        {totalMultiplier}x
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Fees and Points Card */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Fees & Points
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Base Fee</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  1.00%
                </span>
              </div>
              {(() => {
                const baseFee = 1.0;
                const krexTierConfig = KREX_TIERS[krexTier];
                let fee = baseFee;
                if (krexBalance > 0) {
                  fee = Math.max(0, fee - krexTierConfig.feeReduction);
                }
                const hasAnyNFT = !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX ||
                  (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some(v => v)));
                const hasDiamondNFT = !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ||
                  (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some(v => v)));
                const hasRarestNFT = !!nftStatus?.hasRarestNFT;
                
                if (hasRarestNFT) {
                  fee = 0;
                } else if (hasDiamondNFT) {
                  fee = Math.max(0, fee - DIAMOND_NFT_FEE_REDUCTION);
                } else if (hasAnyNFT) {
                  fee = Math.max(0, fee - NFT_FEE_REDUCTION);
                }
                
                // Calculate cost reduction
                let costReductionPercent = krexBalance > 0 ? krexTierConfig.costReduction : 0;
                if (hasRarestNFT) {
                  costReductionPercent += RAREST_NFT_COST_REDUCTION;
                } else if (hasDiamondNFT) {
                  costReductionPercent += DIAMOND_NFT_COST_REDUCTION;
                } else if (hasAnyNFT) {
                  costReductionPercent += NFT_COST_REDUCTION;
                }
                // Mock node status (same as multiplier calculation)
                const mockNodeStatus = { hasLightNode: false, hasMirrorNode: false };
                const activeNodeType = mockNodeStatus.hasMirrorNode ? 'mirror' : mockNodeStatus.hasLightNode ? 'light' : null;
                if (activeNodeType) {
                  costReductionPercent += (activeNodeType === 'mirror' ? MIRROR_NODE_COST_REDUCTION : LIGHT_NODE_COST_REDUCTION);
                }
                costReductionPercent = Math.min(50, costReductionPercent);
                
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Current Fee</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {fee.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Cost Reduction</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {costReductionPercent > 0 ? (
                          <span className="text-green-600 dark:text-green-400">-{costReductionPercent}%</span>
                        ) : (
                          '0%'
                        )}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Total XP</span>
                        <span className="font-bold text-[#02abb8] text-lg">
                          {holdings ? formatLargeNumber(holdings.xp) : '0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-zinc-600 dark:text-zinc-400">NFT Points</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {isNFTLoading ? 'Loading...' : formatLargeNumber(nftPoints || 0)}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* LRT/dApp tokens section removed: rewards are GRID/tGRID only */}
      </div>

      {/* Rewards Tables */}
      <div className="space-y-8">
        {/* KREX Tier Rewards Table */}
        {(!filters.types.length || filters.types.includes('krex-tier')) && (
          <div id="krex-tier-rewards">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              KREX Tier Rewards
            </h2>
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                Loading rewards...
              </div>
            ) : (
              <TierRewardsTable
                currentTier={krexTier}
                krexBalance={krexBalance || 0}
              />
            )}
          </div>
        )}

        {/* NFT Rewards Table */}
        {(!filters.types.length || filters.types.includes('nft')) && (
          <div id="nft-rewards">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              NFT Rewards (PIXELKREX and KREXPRIME)
            </h2>
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                Loading rewards...
              </div>
            ) : (
              <NFTRewardsTable
                nftStatus={nftStatus || defaultNFTStatus}
                nftPoints={nftPoints || 0}
              />
            )}
          </div>
        )}

        {/* Node Rewards Table */}
        {(!filters.types.length || filters.types.includes('node')) && (
          <div id="node-rewards">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Node Rewards
            </h2>
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                Loading rewards...
              </div>
            ) : (
              <NodeRewardsTable
                hasNode={false} // TODO: Implement node status detection
                nodeType={undefined}
              />
            )}
          </div>
        )}

        {/* Premium Features Table */}
        {(!filters.types.length || filters.types.includes('premium')) && (
          <div id="premium-features">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Premium Features
            </h2>
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                Loading rewards...
              </div>
            ) : (
              <PremiumRewardsTable
                krexTier={krexTier}
                nftStatus={nftStatus || defaultNFTStatus}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
