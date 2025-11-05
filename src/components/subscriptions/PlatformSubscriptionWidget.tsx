'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { parseKAS, formatKAS } from '@/lib/revenue/feeCalculator';
import { CONTRACT_ADDRESSES, getContractAddress } from '@/lib/contracts/addresses';
import { PLATFORM_SUBSCRIPTION_ABI } from '@/lib/contracts/abis';

/**
 * PlatformSubscriptionWidget Component
 * 
 * Allows users to subscribe to the platform-wide subscription
 */
export function PlatformSubscriptionWidget() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);

  const contractAddress = getContractAddress(chainId, 'PlatformSubscription') || 
    (chainId === 202555 ? CONTRACT_ADDRESSES.kasplexL2Mainnet.PlatformSubscription : 
     chainId === 167012 ? CONTRACT_ADDRESSES.kasplexL2Testnet.PlatformSubscription : '');

  // Read monthly price
  const { data: monthlyPrice, isLoading: isLoadingPrice } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PLATFORM_SUBSCRIPTION_ABI,
    functionName: 'monthlyPrice',
    query: {
      enabled: !!contractAddress && isConnected,
    },
  });

  // Check subscription status
  const { data: isSubscribed } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PLATFORM_SUBSCRIPTION_ABI,
    functionName: 'isSubscribed',
    args: [address || '0x0'],
    query: {
      enabled: !!contractAddress && isConnected && !!address,
    },
  });

  // Write contract for subscription
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

  const handleSubscribe = async () => {
    setError(null);

    if (!isConnected) {
      setError('Please connect your wallet');
      return;
    }

    if (!contractAddress) {
      setError('Contract not deployed on this network');
      return;
    }

    if (!monthlyPrice) {
      setError('Unable to fetch subscription price');
      return;
    }

    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PLATFORM_SUBSCRIPTION_ABI,
        functionName: 'subscribe',
        value: monthlyPrice as bigint,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    }
  };

  const isLoading = isPendingWrite || isConfirming;
  const displayError = error || writeError?.message || txError?.message;
  const priceString = monthlyPrice ? formatKAS(monthlyPrice as bigint) : '0';

  if (!isConnected) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Please connect your wallet to subscribe
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Platform Subscription
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Subscribe to access all premium dApps on Kasparex
        </p>
      </div>

      {isSubscribed ? (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-600 dark:text-green-400 font-semibold">
            ✓ You have an active platform subscription
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Monthly Price:
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoadingPrice ? 'Loading...' : `${priceString} KAS`}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Access all premium dApps for 30 days
            </p>
          </div>

          {displayError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
            </div>
          )}

          {isConfirmed && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Subscription successful! Transaction: {hash?.slice(0, 10)}...
              </p>
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={isLoading || !monthlyPrice || !contractAddress || isLoadingPrice}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isPendingWrite ? 'Confirming...' : 'Processing...'}
              </span>
            ) : (
              'Subscribe Now'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

