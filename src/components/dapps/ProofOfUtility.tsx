/**
 * Proof-of-Utility Component
 * Auto-detect P-o-U events and display usage history
 */

'use client';

import { useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { PROOF_OF_UTILITY_ABI } from '@/lib/contracts/abis';

export interface ProofOfUtilityProps {
  proofOfUtilityAddress: string;
  userAddress?: string;
  className?: string;
}

export interface UsageEvent {
  user: string;
  dAppContract: string;
  dAppId: bigint;
  actionType: string;
  timestamp: bigint;
}

export function ProofOfUtility({
  proofOfUtilityAddress,
  userAddress,
  className = '',
}: ProofOfUtilityProps) {
  const { address: connectedAddress } = useAccount();
  const address = userAddress || connectedAddress;

  // Get user's usage events
  const { data: events, isLoading } = useReadContract({
    address: proofOfUtilityAddress as `0x${string}`,
    abi: PROOF_OF_UTILITY_ABI,
    functionName: 'getUserEvents',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!proofOfUtilityAddress,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  });

  // Get total event count
  const { data: eventCount } = useReadContract({
    address: proofOfUtilityAddress as `0x${string}`,
    abi: PROOF_OF_UTILITY_ABI,
    functionName: 'getUserEventCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!proofOfUtilityAddress,
      refetchInterval: 30000,
    },
  });

  const recentEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return [];
    
    // Sort by timestamp (newest first) and take last 10
    return [...events]
      .sort((a, b) => {
        const aTime = Number(a.timestamp || 0);
        const bTime = Number(b.timestamp || 0);
        return bTime - aTime;
      })
      .slice(0, 10);
  }, [events]);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!address) {
    return (
      <div className={`p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 ${className}`}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect wallet to view Proof-of-Utility events
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Proof-of-Utility
        </h3>
        {eventCount !== undefined && (
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {Number(eventCount)} events
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="p-4 text-center text-zinc-600 dark:text-zinc-400">
          Loading events...
        </div>
      ) : recentEvents.length === 0 ? (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No usage events yet. Start using dApps to earn rewards!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentEvents.map((event: UsageEvent, index: number) => (
            <div
              key={index}
              className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {event.actionType}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    dApp ID: {Number(event.dAppId)}
                  </p>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {formatDate(event.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

