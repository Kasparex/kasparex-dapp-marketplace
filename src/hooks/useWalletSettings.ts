import { useQuery } from '@tanstack/react-query';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { nodeFirstGet } from '@/lib/nodes/node-first';

export type WalletSettings = {
  ok: boolean;
  address: string;
  autoClaimEnabled: boolean;
  autoClaimMinGrid: number;
};

export function useWalletSettings() {
  const { state } = useKaspaWallet();
  const address = state.address;

  return useQuery({
    queryKey: ['wallet-settings', address ?? 'disconnected'],
    enabled: Boolean(address),
    queryFn: async () => {
      const r = await nodeFirstGet<WalletSettings>(`/kasparex/wallet/settings?address=${encodeURIComponent(address!)}`, {
        roles: ['mirror', 'light'],
        maxNodeAttempts: 3,
        timeoutMs: 3500,
      });
      return r.data;
    },
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}

