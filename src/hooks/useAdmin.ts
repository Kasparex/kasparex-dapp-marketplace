'use client';

import { useAccount } from 'wagmi';
import { useMemo } from 'react';
import { isAdminAddress } from '@/lib/admin';

/**
 * Hook to check if the connected wallet is an admin
 * @returns Object with isAdmin boolean and adminAddress
 */
export function useAdmin() {
  const { address, isConnected } = useAccount();
  
  const isAdmin = useMemo(() => {
    if (!isConnected || !address) {
      return false;
    }
    return isAdminAddress(address);
  }, [address, isConnected]);
  
  return {
    isAdmin,
    adminAddress: isAdmin ? address : undefined,
    isConnected,
  };
}

