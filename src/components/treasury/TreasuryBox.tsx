'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddress } from '@/lib/contracts/addresses';
import { FEE_COLLECTOR_ABI, TREASURY_ABI } from '@/lib/contracts/abis';
import { useKaspaWallet } from '@/lib/kaspa/context';

interface TreasuryBoxProps {
  compact?: boolean;
  showPerDApp?: boolean;
}

interface TreasuryData {
  totalTVL: number;
  kasparexTreasury: number;
  perDApp: {
    dAppId: string;
    name: string;
    tvl: number;
  }[];
}

export function TreasuryBox({ compact = false, showPerDApp = false }: TreasuryBoxProps) {
  const [treasuryData, setTreasuryData] = useState<TreasuryData>({
    totalTVL: 0,
    kasparexTreasury: 0,
    perDApp: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { address: evmAddress } = useAccount();
  const chainId = useChainId();
  const { state: kaspaState } = useKaspaWallet();

  // Get treasury contract address directly (or get it from FeeCollector)
  const treasuryAddress = getContractAddress(chainId, 'Treasury');
  const feeCollectorAddress = getContractAddress(chainId, 'FeeCollector');

  // First, get treasury address from FeeCollector if we don't have it directly
  const { data: treasuryAddressFromCollector } = useReadContract({
    address: feeCollectorAddress as `0x${string}` | undefined,
    abi: FEE_COLLECTOR_ABI,
    functionName: 'treasury',
    query: {
      enabled: !!feeCollectorAddress && !treasuryAddress && !!evmAddress,
    },
  });

  // Use treasury address (direct or from FeeCollector)
  const finalTreasuryAddress = (treasuryAddress || treasuryAddressFromCollector) as `0x${string}` | undefined;

  // Read treasury balance from Treasury contract (L2)
  const { data: treasuryBalance, isLoading: isLoadingBalance } = useReadContract({
    address: finalTreasuryAddress,
    abi: TREASURY_ABI,
    functionName: 'getBalance',
    query: {
      enabled: !!finalTreasuryAddress && !!evmAddress,
    },
  });

  useEffect(() => {
    loadTreasuryData();
  }, [chainId, treasuryBalance]);

  const loadTreasuryData = async () => {
    setIsLoading(true);
    try {
      // For L2, get from contract
      let l2Treasury = 0;
      if (treasuryBalance) {
        l2Treasury = parseFloat(formatEther(treasuryBalance as bigint));
      }

      // For L1, would need to query Kaspa addresses or API
      // TODO: Implement L1 treasury tracking
      const l1Treasury = 0;

      // Calculate total TVL
      const totalTVL = l1Treasury + l2Treasury;

      // Per-dApp TVL (would need to track per contract)
      // For now, placeholder data
      const perDApp: TreasuryData['perDApp'] = [
        { dAppId: 'dao-voting', name: 'DAO Voting', tvl: l2Treasury * 0.3 }, // Example: 30% of L2
        { dAppId: 'simple-payment', name: 'Simple Payment', tvl: l2Treasury * 0.2 }, // Example: 20% of L2
        { dAppId: 'quiz-to-earn', name: 'Quiz to Earn', tvl: l2Treasury * 0.1 }, // Example: 10% of L2
      ];

      setTreasuryData({
        totalTVL,
        kasparexTreasury: l2Treasury, // For now, just L2
        perDApp,
      });
    } catch (error) {
      console.error('Error loading treasury data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Total TVL</span>
          {isLoading ? (
            <span className="text-sm text-zinc-500 dark:text-zinc-500">Loading...</span>
          ) : (
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              {treasuryData.totalTVL.toFixed(2)} KAS
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-6 space-y-6 border border-zinc-200 dark:border-zinc-700">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">Kasparex Treasury</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Total Value Locked (TVL) across the entire ecosystem
        </p>
      </div>

      {/* Total TVL */}
      <div className="bg-white dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Total TVL</span>
          {isLoading || isLoadingBalance ? (
            <span className="text-sm text-zinc-500 dark:text-zinc-500">Loading...</span>
          ) : (
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">
              {treasuryData.totalTVL.toFixed(2)} KAS
            </span>
          )}
        </div>
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          L1: {treasuryData.kasparexTreasury * 0.3} KAS | L2: {treasuryData.kasparexTreasury.toFixed(2)} KAS
        </div>
      </div>

      {/* Kasparex Treasury */}
      <div>
        <label className="text-sm text-zinc-600 dark:text-zinc-400">Kasparex Treasury</label>
        <div className="mt-1 text-xl font-semibold text-zinc-900 dark:text-white">
          {treasuryData.kasparexTreasury.toFixed(2)} KAS
        </div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Collected fees from all dApps
        </p>
      </div>

      {/* Per-dApp TVL */}
      {showPerDApp && treasuryData.perDApp.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-3">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Per-dApp TVL</h4>
          <div className="space-y-2">
            {treasuryData.perDApp.map((dApp) => (
              <div
                key={dApp.dAppId}
                className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{dApp.name}</span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {dApp.tvl.toFixed(2)} KAS
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          TVL represents the total value collected from fees across all dApps in the Kasparex ecosystem.
          This includes fees from L1 (Kaspa native) and L2 (EVM) transactions.
        </p>
      </div>
    </div>
  );
}
