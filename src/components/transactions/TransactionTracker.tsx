'use client';

import { useState, useEffect } from 'react';
import { getStoredTransactions, updateTransactionReward, type TransactionDetails } from '@/lib/transactions/tracker';
import { getL1RewardStatus } from '@/lib/rewards/l1Distribution';
import { formatEther } from 'viem';
import { useAccount, useChainId } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';

interface TransactionTrackerProps {
  txHash?: string; // If provided, shows details for this specific transaction
  showAll?: boolean; // If true, shows list of all transactions
  compact?: boolean; // Compact view
}

export function TransactionTracker({ txHash, showAll = false, compact = false }: TransactionTrackerProps) {
  const [transactions, setTransactions] = useState<TransactionDetails[]>([]);
  const [selectedTx, setSelectedTx] = useState<TransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { address: evmAddress } = useAccount();
  const chainId = useChainId();
  const { state: kaspaState } = useKaspaWallet();

  // Get current user address
  const currentAddress = evmAddress || kaspaState.address || null;

  useEffect(() => {
    if (txHash) {
      const tx = getStoredTransactions().find(t => t.txHash === txHash);
      if (tx) {
        setSelectedTx(tx);
        checkRewardStatus(tx);
      }
    } else if (showAll) {
      loadTransactions();
    }
  }, [txHash, showAll]);

  const loadTransactions = () => {
    const stored = getStoredTransactions();
    // Filter by current user if address is available
    const filtered = currentAddress
      ? stored.filter(tx => tx.userAddress.toLowerCase() === currentAddress.toLowerCase())
      : stored;
    setTransactions(filtered);
  };

  const checkRewardStatus = async (tx: TransactionDetails) => {
    if (!tx.rewardId || tx.network !== 'L1') return;

    setIsLoading(true);
    try {
      const status = await getL1RewardStatus(tx.rewardId);
      
      updateTransactionReward(tx.txHash, {
        rewardStatus: status.status as any,
        gridReward: status.gridReward,
        dAppTokenReward: status.dAppTokenReward,
      });

      // Reload to show updated status
      const updated = getStoredTransactions().find(t => t.txHash === tx.txHash);
      if (updated) {
        setSelectedTx(updated);
      }
    } catch (error) {
      console.error('Error checking reward status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact && selectedTx) {
    return (
      <div className="bg-zinc-800 dark:bg-zinc-800/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Transaction</span>
          <span className="text-xs font-mono text-zinc-500">
            {selectedTx.txHash.slice(0, 12)}...{selectedTx.txHash.slice(-8)}
          </span>
        </div>
        {selectedTx.fee > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Fee</span>
            <span className="text-sm text-zinc-300">{selectedTx.fee.toFixed(8)} KAS</span>
          </div>
        )}
        {selectedTx.rewardStatus && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Reward</span>
            <span className={`text-sm ${
              selectedTx.rewardStatus === 'completed' ? 'text-green-400' :
              selectedTx.rewardStatus === 'pending' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {selectedTx.rewardStatus}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (selectedTx) {
    return (
      <div className="bg-zinc-800 dark:bg-zinc-800/50 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Transaction Details</h3>
          <button
            onClick={() => setSelectedTx(null)}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Transaction Hash */}
        <div>
          <label className="text-sm text-zinc-400">Transaction Hash</label>
          <div className="mt-1 font-mono text-sm text-zinc-300 break-all">
            {selectedTx.txHash}
          </div>
          <a
            href={`${selectedTx.network === 'L1' ? 'https://explorer.kaspa.org/txs/' : `https://explorer.kasplex.com/tx/`}${selectedTx.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#70C7BA] hover:underline mt-1 inline-block"
          >
            View on Explorer →
          </a>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-zinc-400">Amount</label>
            <div className="mt-1 text-lg font-semibold text-white">
              {selectedTx.amount.toFixed(8)} KAS
            </div>
          </div>
          {selectedTx.fee > 0 && (
            <div>
              <label className="text-sm text-zinc-400">Fee</label>
              <div className="mt-1 text-lg font-semibold text-red-400">
                -{selectedTx.fee.toFixed(8)} KAS
              </div>
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        {selectedTx.baseCost !== undefined && (
          <div className="border-t border-zinc-700 pt-4 space-y-2">
            <h4 className="text-sm font-semibold text-zinc-300">Cost Breakdown</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Base Cost</span>
                <span className="text-zinc-300">{selectedTx.baseCost.toFixed(8)} KAS</span>
              </div>
              {selectedTx.costReduction && selectedTx.costReduction > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount Applied</span>
                  <span>-{selectedTx.costReduction.toFixed(8)} KAS</span>
                </div>
              )}
              {selectedTx.finalCost !== undefined && (
                <div className="flex justify-between font-semibold pt-2 border-t border-zinc-700">
                  <span className="text-zinc-300">Final Cost</span>
                  <span className="text-white">{selectedTx.finalCost.toFixed(8)} KAS</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reward Status */}
        {selectedTx.rewardId && (
          <div className="border-t border-zinc-700 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-300">Reward Status</h4>
              {isLoading && (
                <span className="text-xs text-zinc-500">Checking...</span>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Status</span>
                <span className={`text-sm font-medium ${
                  selectedTx.rewardStatus === 'completed' ? 'text-green-400' :
                  selectedTx.rewardStatus === 'processing' ? 'text-yellow-400' :
                  selectedTx.rewardStatus === 'failed' ? 'text-red-400' :
                  'text-zinc-400'
                }`}>
                  {selectedTx.rewardStatus || 'pending'}
                </span>
              </div>

              {selectedTx.gridReward !== undefined && selectedTx.gridReward > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">GRID Reward</span>
                  <span className="text-sm text-green-400 font-medium">
                    +{selectedTx.gridReward.toFixed(4)} GRID
                  </span>
                </div>
              )}

              {selectedTx.dAppTokenReward !== undefined && selectedTx.dAppTokenReward > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">dApp Token Reward</span>
                  <span className="text-sm text-green-400 font-medium">
                    +{selectedTx.dAppTokenReward.toFixed(4)} Tokens
                  </span>
                </div>
              )}

              {selectedTx.xpReward !== undefined && selectedTx.xpReward > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">XP Reward</span>
                  <span className="text-sm text-blue-400 font-medium">
                    +{selectedTx.xpReward.toFixed(0)} XP
                  </span>
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-zinc-700">
                <span className="text-xs text-zinc-500">Reward ID: {selectedTx.rewardId}</span>
              </div>
            </div>

            <button
              onClick={() => checkRewardStatus(selectedTx)}
              disabled={isLoading}
              className="mt-2 w-full px-3 py-2 text-sm bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Refresh Status
            </button>
          </div>
        )}

        {/* Network and dApp Info */}
        <div className="border-t border-zinc-700 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Network</span>
            <span className="text-zinc-300">{selectedTx.network}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">dApp</span>
            <span className="text-zinc-300">{selectedTx.dAppId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Action</span>
            <span className="text-zinc-300">{selectedTx.actionType}</span>
          </div>
        </div>
      </div>
    );
  }

  if (showAll) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Transaction History</h3>
          <button
            onClick={loadTransactions}
            className="text-sm text-[#70C7BA] hover:underline"
          >
            Refresh
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            No transactions found
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.txHash}
                onClick={() => setSelectedTx(tx)}
                className="bg-zinc-800 dark:bg-zinc-800/50 rounded-lg p-4 cursor-pointer hover:bg-zinc-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm text-zinc-300">
                      {tx.txHash.slice(0, 12)}...{tx.txHash.slice(-8)}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">
                      {tx.amount.toFixed(4)} KAS
                    </div>
                    {tx.rewardStatus && (
                      <div className={`text-xs mt-1 ${
                        tx.rewardStatus === 'completed' ? 'text-green-400' :
                        tx.rewardStatus === 'pending' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {tx.rewardStatus}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
