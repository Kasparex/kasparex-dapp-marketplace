'use client';

import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getAllDApps } from '@/lib/dapps';
import { getMockWalletHoldings } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { type UserRewardStatus } from '@/lib/rewards/dashboard-data';
import { KREX_TIERS, NFT_MULTIPLIER, DIAMOND_NFT_MULTIPLIER, RAREST_NFT_MULTIPLIER } from '@/lib/rewards/types';
import { TierRewardsTable } from './TierRewardsTable';
import { NFTRewardsTable } from './NFTRewardsTable';
import { NodeRewardsTable } from './NodeRewardsTable';
import { PremiumRewardsTable } from './PremiumRewardsTable';
import { DAppTokenBalanceRow } from './DAppTokenBalanceRow';
import { TierBadge } from './TierBadge';

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

  // Get GRID token address and balance
  const gridTokenAddress = getContractAddress(chainId, 'GRIDToken') || null;
  const { formattedBalance: gridFormattedBalance, isLoading: isGRIDLoading } = useGRIDToken(gridTokenAddress);

  // Get all dApps with contract addresses
  const dApps = getAllDApps();
  const dAppsWithTokens = dApps.filter((dapp) => dapp.contractAddress);


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
      {/* Token Balances Dashboard */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
          Token Balances
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
                const krexTierConfig = KREX_TIERS[krexTier];
                const krexMultiplier = krexTierConfig.multiplier;
                
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
                    {nodeMultiplierAdd > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Node Bonus</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          +{nodeMultiplierAdd}x
                        </span>
                      </div>
                    )}
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

          {/* XP Points Card */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              XP Points
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Total XP</span>
                <span className="font-bold text-[#02abb8] text-lg">
                  {holdings ? formatLargeNumber(holdings.xp) : '0'}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">XP Rewards</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
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
            </div>
          </div>
        </div>

        {/* dApp Tokens Section */}
        {dAppsWithTokens.length > 0 && (
          <div className="mt-6">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              dApp Tokens
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      dApp
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Token
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Balance
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Contract
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dAppsWithTokens.map((dapp) => (
                    <DAppTokenBalanceRow
                      key={dapp.id}
                      dappId={dapp.id}
                      dappName={dapp.name}
                      contractAddress={dapp.contractAddress || ''}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Rewards Tables */}
      <div className="space-y-8">
        {/* KREX Tier Rewards Table */}
        {(!filters.types.length || filters.types.includes('krex-tier')) && (
          <div>
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
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              NFT Rewards
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
          <div>
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
          <div>
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
