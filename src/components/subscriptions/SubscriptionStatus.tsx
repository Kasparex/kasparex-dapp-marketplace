'use client';

import { useAccount, useReadContract, useChainId } from 'wagmi';
import { CONTRACT_ADDRESSES, getContractAddress } from '@/lib/contracts/addresses';
import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis';
import { formatExpiryDate, getDaysUntilExpiry, isExpired } from '@/lib/subscriptions/subscriptionUtils';
import { formatKAS } from '@/lib/revenue/feeCalculator';

/**
 * SubscriptionStatus Component
 * 
 * Displays the current subscription status for a user
 */
export function SubscriptionStatus({ dAppContract }: { dAppContract?: string }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  
  const subscriptionManagerAddress = getContractAddress(chainId, 'SubscriptionManager') || 
    (chainId === 202555 ? CONTRACT_ADDRESSES.kasplexL2Mainnet.SubscriptionManager : 
     chainId === 167012 ? CONTRACT_ADDRESSES.kasplexL2Testnet.SubscriptionManager : '');

  const { data: subscriptionStatus, isLoading } = useReadContract({
    address: subscriptionManagerAddress as `0x${string}`,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: 'getSubscriptionStatus',
    args: [address || '0x0', (dAppContract as `0x${string}`) || '0x0'],
    query: {
      enabled: isConnected && !!address && !!subscriptionManagerAddress,
    },
  });

  if (!isConnected) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Connect your wallet to view subscription status
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading subscription status...</p>
      </div>
    );
  }

  if (!subscriptionStatus) {
    return null;
  }

  const [
    platformSubscribed,
    platformExpiry,
    dAppSubscribed,
    dAppExpiry,
    hasAccess,
  ] = subscriptionStatus as [boolean, bigint, boolean, bigint, boolean];

  const platformDays = getDaysUntilExpiry(platformExpiry);
  const dAppDays = dAppSubscribed ? getDaysUntilExpiry(dAppExpiry) : 0;

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Subscription Status
      </h3>
      
      <div className="space-y-3">
        {/* Platform Subscription */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Platform Subscription
            </span>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                platformSubscribed && !isExpired(platformExpiry)
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {platformSubscribed && !isExpired(platformExpiry) ? 'Active' : 'Inactive'}
            </span>
          </div>
          {platformSubscribed && platformExpiry > 0n ? (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <p>Expires: {formatExpiryDate(platformExpiry)}</p>
              <p className={platformDays < 7 ? 'text-orange-600 dark:text-orange-400' : ''}>
                {platformDays > 0 ? `${platformDays} days remaining` : 'Expired'}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-500">No active subscription</p>
          )}
        </div>

        {/* Per-DApp Subscription (if dApp contract provided) */}
        {dAppContract && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                dApp Subscription
              </span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  dAppSubscribed && !isExpired(dAppExpiry)
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {dAppSubscribed && !isExpired(dAppExpiry) ? 'Active' : 'Inactive'}
              </span>
            </div>
            {dAppSubscribed && dAppExpiry > 0n ? (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p>Expires: {formatExpiryDate(dAppExpiry)}</p>
                <p className={dAppDays < 7 ? 'text-orange-600 dark:text-orange-400' : ''}>
                  {dAppDays > 0 ? `${dAppDays} days remaining` : 'Expired'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-500">No active subscription</p>
            )}
          </div>
        )}

        {/* Overall Access Status */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Access Status
            </span>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded ${
                hasAccess
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {hasAccess ? '✓ Has Access' : '✗ No Access'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

