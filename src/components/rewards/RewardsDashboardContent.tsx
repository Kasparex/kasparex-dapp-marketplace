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
import { getUserRewardStatus, filterRewards, type UserRewardStatus } from '@/lib/rewards/dashboard-data';
import { RewardsTable } from './RewardsTable';
import { DAppTokenBalanceRow } from './DAppTokenBalanceRow';

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
  const { nftStatus, isLoading: isNFTLoading } = useNFTStatus();
  const holdings = isConnected && address ? getMockWalletHoldings(address) : null;

  // Get GRID token address and balance
  const gridTokenAddress = getContractAddress(chainId, 'GRIDToken') || null;
  const { formattedBalance: gridFormattedBalance, isLoading: isGRIDLoading } = useGRIDToken(gridTokenAddress);

  // Get all dApps with contract addresses
  const dApps = getAllDApps();
  const dAppsWithTokens = dApps.filter((dapp) => dapp.contractAddress);


  // Get user reward status
  const userStatus: UserRewardStatus = useMemo(() => {
    return {
      krexTier,
      krexBalance: krexBalance || 0,
      nftStatus: nftStatus || {
        hasKREXPRIME: false,
        hasPIXELKREX: false,
        hasDiamondKREXPRIME: false,
        hasDiamondPIXELKREX: false,
        hasRarestNFT: false,
        partnerCollections: {},
        partnerDiamonds: {},
      },
      hasNode: false, // TODO: Implement node status detection
      nodeType: undefined,
    };
  }, [krexTier, krexBalance, nftStatus]);

  // Get all rewards with user status
  const allRewards = useMemo(() => {
    return getUserRewardStatus(userStatus);
  }, [userStatus]);

  // Filter rewards
  const filteredRewards = useMemo(() => {
    return filterRewards(allRewards, {
      types: filters.types.length > 0 ? filters.types : undefined,
      status: filters.status.length > 0 ? filters.status : undefined,
      searchQuery: searchQuery.trim() || undefined,
    });
  }, [allRewards, filters, searchQuery]);

  const isLoading = isKREXLoading || isNFTLoading || isGRIDLoading;

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
            ) : isConnected ? (
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
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Current Tier</span>
                  <span className="text-xs px-2 py-1 bg-[#02abb8]/10 text-[#02abb8] rounded font-medium">
                    {krexTier.replace('Tier', 'Tier ')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Connect wallet to view balance
              </div>
            )}
          </div>

          {/* GRID Balance Card */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              GRID Token
            </h3>
            {isGRIDLoading ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</div>
            ) : isConnected ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Balance</span>
                  <span className="font-bold text-[#02abb8] text-lg">
                    {gridFormattedBalance || '0'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Connect wallet to view balance
              </div>
            )}
          </div>

          {/* XP Points Card */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              XP Points
            </h3>
            {isConnected && holdings ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Total XP</span>
                  <span className="font-bold text-[#02abb8] text-lg">
                    {formatLargeNumber(holdings.xp)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Connect wallet to view balance
              </div>
            )}
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

      {/* Rewards Table */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            All Rewards & Benefits
          </h2>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {filteredRewards.length} of {allRewards.length} rewards
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            Loading rewards...
          </div>
        ) : (
          <RewardsTable
            rewards={filteredRewards}
            searchQuery={searchQuery}
            userStatus={{ krexTier }}
          />
        )}
      </div>
    </div>
  );
}
