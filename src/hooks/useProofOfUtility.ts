/**
 * Hook for Proof-of-Utility Tracking
 * Auto event detection and tracking
 */

'use client';

import { useAccount, useReadContract, useWatchContractEvent } from 'wagmi';
import { PROOF_OF_UTILITY_ABI } from '@/lib/contracts/abis';
import { useEffect, useState } from 'react';

export interface UsageEvent {
  user: string;
  dAppContract: string;
  dAppId: bigint;
  actionType: string;
  timestamp: bigint;
}

export interface UseProofOfUtilityResult {
  events: UsageEvent[];
  eventCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for Proof-of-Utility tracking
 */
export function useProofOfUtility(
  proofOfUtilityAddress: string | null | undefined,
  userAddress?: string
): UseProofOfUtilityResult {
  const { address: connectedAddress } = useAccount();
  const address = userAddress || connectedAddress;
  const [events, setEvents] = useState<UsageEvent[]>([]);

  // Get user's usage events
  const { data: fetchedEvents, isLoading, error, refetch } = useReadContract({
    address: proofOfUtilityAddress as `0x${string}`,
    abi: PROOF_OF_UTILITY_ABI,
    functionName: 'getUserEvents',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!proofOfUtilityAddress,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  }) as { data: unknown; isLoading: boolean; error: Error | null; refetch: () => void };

  // Watch for new events
  useWatchContractEvent({
    address: proofOfUtilityAddress as `0x${string}`,
    abi: PROOF_OF_UTILITY_ABI,
    eventName: 'UsageEventRecorded',
    onLogs(logs) {
      // Filter logs for this user
      const userLogs = logs.filter(
        (log) => log.args.user?.toLowerCase() === address?.toLowerCase()
      );
      
      if (userLogs.length > 0) {
        // Refetch events when new ones are detected
        refetch();
      }
    },
  });

  // Update events when fetched
  useEffect(() => {
    if (fetchedEvents && Array.isArray(fetchedEvents)) {
      const parsedEvents: UsageEvent[] = fetchedEvents.map((event: any) => ({
        user: event.user || '',
        dAppContract: event.dAppContract || '',
        dAppId: event.dAppId || BigInt(0),
        actionType: event.actionType || '',
        timestamp: event.timestamp || BigInt(0),
      }));
      setEvents(parsedEvents);
    }
  }, [fetchedEvents]);

  // Get event count
  const { data: eventCount } = useReadContract({
    address: proofOfUtilityAddress as `0x${string}`,
    abi: PROOF_OF_UTILITY_ABI,
    functionName: 'getUserEventCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!proofOfUtilityAddress,
      refetchInterval: 30000,
    },
  }) as { data: bigint | undefined };

  return {
    events,
    eventCount: eventCount ? Number(eventCount) : 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

