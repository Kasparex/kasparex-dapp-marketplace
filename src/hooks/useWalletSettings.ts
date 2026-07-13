'use client';

import { useQuery } from '@tanstack/react-query';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { nodeFirstGet } from '@/lib/nodes/node-first';
import { useDocumentVisible, visibilityGatedInterval } from '@/hooks/useDocumentVisible';

export type WalletSettings = {
  ok: boolean;
  address: string;
  autoClaimEnabled: boolean;
  autoClaimMinGrid: number;
};

export function useWalletSettings() {
  const { state } = useKaspaWallet();
  const address = state.address;
  const visible = useDocumentVisible();

  return useQuery({
    queryKey: ['wallet-settings', address ?? 'disconnected'],
    enabled: Boolean(address),
    queryFn: async () => {
      const r = await nodeFirstGet<WalletSettings>(`/kasparex/wallet/settings?address=${encodeURIComponent(address!)}`, {
        roles: ['edge', 'light'],
        maxNodeAttempts: 3,
        timeoutMs: 3500,
      });
      return r.data;
    },
    staleTime: 30_000,
    refetchInterval: visibilityGatedInterval(60_000, visible),
  });
}

