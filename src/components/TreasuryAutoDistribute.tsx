'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { TREASURY_ABI } from '@/lib/contracts/abis';
import { formatEther } from 'viem';

interface TreasuryAutoDistributeProps {
  autoDistribute?: boolean;
  onDistribute?: () => void;
}

/**
 * Treasury Auto-Distribute Component
 * 
 * Automatically distributes fees after they're collected (if enabled)
 * Can also be triggered manually
 */
export function TreasuryAutoDistribute({ autoDistribute = false, onDistribute }: TreasuryAutoDistributeProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isDistributing, setIsDistributing] = useState(false);

  const treasuryAddress = getContractAddress(chainId, 'Treasury');

  // Read Treasury balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: treasuryAddress as `0x${string}`,
    abi: TREASURY_ABI,
    functionName: 'getBalance',
    query: {
      enabled: !!treasuryAddress && isConnected,
    },
  });

  // Write contract for distribution
  const { 
    writeContract, 
    data: hash, 
    isPending: isPendingWrite,
    error: writeError 
  } = useWriteContract();

  // Wait for transaction
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: txError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDistribute = async () => {
    if (!treasuryAddress || !isConnected) return;

    try {
      setIsDistributing(true);
      await writeContract({
        address: treasuryAddress as `0x${string}`,
        abi: TREASURY_ABI,
        functionName: 'distributeRevenue',
      });
    } catch (error) {
      console.error('Failed to distribute revenue:', error);
    } finally {
      setIsDistributing(false);
    }
  };

  // Auto-distribute if enabled and balance > 0
  const balanceBigInt = balance && typeof balance === 'bigint' ? balance : (balance ? BigInt(balance.toString()) : 0n);
  const shouldAutoDistribute = autoDistribute && balanceBigInt > 0n && !isDistributing && !isPendingWrite && !isConfirming;

  if (shouldAutoDistribute) {
    handleDistribute();
  }

  // Call onDistribute callback when distribution is confirmed
  if (isConfirmed && onDistribute) {
    onDistribute();
    refetchBalance();
  }

  const isLoading = isPendingWrite || isConfirming;
  const displayError = writeError?.message || txError?.message;
  const balanceString = balanceBigInt > 0n ? formatEther(balanceBigInt) : '0';

  if (!isConnected || !treasuryAddress) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
            Treasury Balance
          </h3>
          <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
            {balanceString} KAS
          </p>
          {autoDistribute && (
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              Auto-distribute enabled
            </p>
          )}
        </div>
        {balanceBigInt > 0n && (
          <button
            onClick={handleDistribute}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isLoading ? 'Distributing...' : 'Distribute Now'}
          </button>
        )}
      </div>
      {displayError && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2">{displayError}</p>
      )}
      {isConfirmed && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
          Revenue distributed successfully!
        </p>
      )}
    </div>
  );
}

