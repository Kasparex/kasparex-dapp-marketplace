'use client';

import { useIsDeveloper, useDeveloperDApps } from '@/lib/contracts/authorization';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';

/**
 * Hook to check if current user is a developer for a specific dApp
 */
export function useDAppAuthorization(dAppId: number | string | undefined) {
  const { address } = useAccount();
  
  // Convert dAppId to number if it's a string
  const numericId = useMemo(() => {
    if (!dAppId) return undefined;
    if (typeof dAppId === 'number') return dAppId;
    const parsed = parseInt(dAppId, 10);
    return isNaN(parsed) ? undefined : parsed;
  }, [dAppId]);

  const { isDeveloper, isLoading } = useIsDeveloper(numericId, address || undefined);

  return {
    isDeveloper: isDeveloper ?? false,
    isLoading,
    hasAccess: isDeveloper ?? false,
  };
}

/**
 * Hook to get all dApp IDs where current user is a developer
 */
export function useMyAssignedDApps() {
  const { address } = useAccount();
  const { dAppIds, isLoading } = useDeveloperDApps(address || undefined);

  return {
    dAppIds: dAppIds?.map(id => Number(id)) || [],
    isLoading,
  };
}

