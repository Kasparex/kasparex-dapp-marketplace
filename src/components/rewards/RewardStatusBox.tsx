'use client';

import { useState, useEffect } from 'react';
import { getL1RewardStatus } from '@/lib/rewards/l1Distribution';
import { useAccount, useChainId, useWaitForTransactionReceipt } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';

interface RewardStatusBoxProps {
  rewardId?: string; // L1 reward ID
  txHash?: string; // L2 transaction hash
  network: 'L1' | 'L2';
  dAppId: string;
  actionType: string;
  compact?: boolean;
}

export function RewardStatusBox({
  rewardId,
  txHash,
  network,
  dAppId,
  actionType,
  compact = false,
}: RewardStatusBoxProps) {
  const [rewardStatus, setRewardStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [gridReward, setGridReward] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For L2, check transaction receipt
  const { data: receipt, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: network === 'L2' && txHash ? (txHash as `0x${string}`) : undefined,
    query: {
      enabled: network === 'L2' && !!txHash,
    },
  });

  useEffect(() => {
    if (network === 'L1' && rewardId) {
      checkL1RewardStatus();
      // Poll every 5 seconds until completed
      const interval = setInterval(() => {
        checkL1RewardStatus();
      }, 5000);

      return () => clearInterval(interval);
    } else if (network === 'L2' && isTxSuccess && receipt) {
      // L2 rewards are distributed via contract, check if successful
      setRewardStatus('completed');
      // Note: Actual reward amounts would need to be read from contract events
    }
  }, [network, rewardId, isTxSuccess, receipt]);

  const checkL1RewardStatus = async () => {
    if (!rewardId) return;

    setIsLoading(true);
    setError(null);

    try {
      const status = await getL1RewardStatus(rewardId);
      setRewardStatus(status.status as any);
      setGridReward(status.gridReward || null);

      // Stop polling if completed or failed
      if (status.status === 'completed' || status.status === 'failed') {
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check reward status');
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="bg-zinc-800 dark:bg-zinc-800/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">Reward Status</span>
          {isLoading ? (
            <span className="text-xs text-zinc-500">Checking...</span>
          ) : rewardStatus ? (
            <span className={`text-xs font-medium ${
              rewardStatus === 'completed' ? 'text-green-400' :
              rewardStatus === 'processing' ? 'text-yellow-400' :
              rewardStatus === 'failed' ? 'text-red-400' :
              'text-zinc-400'
            }`}>
              {rewardStatus}
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Pending</span>
          )}
        </div>
        {gridReward !== null && gridReward > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">GRID</span>
            <span className="text-xs text-green-400 font-medium">+{gridReward.toFixed(4)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 dark:bg-zinc-800/50 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Reward Status</h3>
        {isLoading && (
          <span className="text-sm text-zinc-400">Checking...</span>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="text-sm text-zinc-400">Status</label>
        <div className="mt-1">
          {rewardStatus ? (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              rewardStatus === 'completed' ? 'bg-green-500/20 text-green-400' :
              rewardStatus === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
              rewardStatus === 'failed' ? 'bg-red-500/20 text-red-400' :
              'bg-zinc-700 text-zinc-400'
            }`}>
              {rewardStatus.charAt(0).toUpperCase() + rewardStatus.slice(1)}
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-zinc-700 text-zinc-400">
              Pending
            </span>
          )}
        </div>
      </div>

      {/* Rewards */}
      {gridReward !== null && gridReward > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-zinc-300">Rewards Earned</h4>
          
          <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-300">GRID Token</span>
            </div>
            <span className="text-lg font-semibold text-green-400">
              +{gridReward.toFixed(4)} GRID
            </span>
          </div>
        </div>
      )}

      {/* Network Info */}
      <div className="border-t border-zinc-700 pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Network</span>
          <span className="text-zinc-300">{network}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">dApp</span>
          <span className="text-zinc-300">{dAppId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Action</span>
          <span className="text-zinc-300">{actionType}</span>
        </div>
        {rewardId && (
          <div className="flex justify-between">
            <span className="text-zinc-400">Reward ID</span>
            <span className="text-xs font-mono text-zinc-500">{rewardId}</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Refresh Button */}
      {network === 'L1' && rewardId && (
        <button
          onClick={checkL1RewardStatus}
          disabled={isLoading}
          className="w-full px-4 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Refresh Status'}
        </button>
      )}
    </div>
  );
}
