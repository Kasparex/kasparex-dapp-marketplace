'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { nodeFirstGet } from '@/lib/nodes/node-first';
import { useDocumentVisible, visibilityGatedInterval } from '@/hooks/useDocumentVisible';

export type WalletHistoryItem = {
  id: string;
  txHash: string;
  network: 'L1' | 'L2' | 'vProgs';
  dappId: string;
  actionType: string;
  actionValue: number;
  status: string;
  gridReward?: number;
  createdAt: number;
  distributedAt?: number;
};

export type WalletHistoryPage = {
  ok: boolean;
  address: string;
  items: WalletHistoryItem[];
  nextCursor?: string;
};

export function useWalletHistory(address: string | null, options?: { limit?: number }) {
  const limit = Math.max(5, Math.min(50, options?.limit ?? 20));
  const visible = useDocumentVisible();

  return useInfiniteQuery({
    queryKey: ['wallet-history', address ?? 'none', limit],
    enabled: Boolean(address),
    queryFn: async ({ pageParam }) => {
      const cursor = typeof pageParam === 'string' ? pageParam : '';
      const url = `/kasparex/wallet/history?address=${encodeURIComponent(address!)}&limit=${limit}${
        cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''
      }`;
      const r = await nodeFirstGet<WalletHistoryPage>(url, {
        roles: ['mirror', 'light'],
        maxNodeAttempts: 3,
        timeoutMs: 3500,
      });
      return r.data;
    },
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 30_000,
    refetchInterval: visibilityGatedInterval(60_000, visible),
    initialPageParam: '',
  });
}

