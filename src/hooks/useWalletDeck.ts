import { useQuery } from '@tanstack/react-query';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { nodeFirstGet } from '@/lib/nodes/node-first';

export type WalletDeck = {
  ok: boolean;
  address: string;
  rewards: {
    pendingCount: number;
    pendingGrid: number;
    totalGrid: number;
    totalRewards: number;
    lastRewardAt?: number;
    recent: Array<{
      id: string;
      txHash: string;
      dappId: string;
      actionType: string;
      actionValue: number;
      gridReward?: number;
      status: string;
      createdAt: number;
      distributedAt?: number;
    }>;
  };
  diamonds?: {
    balance: number;
    pending?: number;
    earnedTotal?: number;
    spentTotal?: number;
  };
  perGame?: {
    rewardsByGame: Array<{ gameId: string; pendingGrid: number; totalGrid: number; count: number }>;
    diamondsByGame: Array<{ gameId: string; earned: number; spent: number }>;
  };
  settings?: { autoClaimEnabled: boolean; autoClaimMinGrid: number };
};

export function useWalletDeck() {
  const { state } = useKaspaWallet();
  const address = state.address;

  return useQuery({
    queryKey: ['wallet-deck', address ?? 'disconnected'],
    enabled: Boolean(address),
    queryFn: async () => {
      const r = await nodeFirstGet<WalletDeck>(`/kasparex/wallet/deck?address=${encodeURIComponent(address!)}`, {
        roles: ['edge', 'light'],
        maxNodeAttempts: 3,
        timeoutMs: 3500,
      });
      return r.data;
    },
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

