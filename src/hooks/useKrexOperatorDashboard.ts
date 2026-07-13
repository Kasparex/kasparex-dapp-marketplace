import { useQuery } from '@tanstack/react-query';
import { fetchWalletNodes } from '@/lib/nodes/operatorApi';

/**
 * Loads nodes registered to the connected Kaspa wallet (no per-epoch reward fetches).
 */
export function useKrexOperatorDashboard(kaspaAddress: string | null | undefined) {
  return useQuery({
    queryKey: ['krex-operator-dashboard', kaspaAddress ?? ''],
    enabled: Boolean(kaspaAddress?.trim()),
    staleTime: 300_000,
    refetchInterval: 300_000,
    queryFn: async () => {
      const addr = kaspaAddress!.trim();
      const deck = await fetchWalletNodes(addr);
      if (!deck.ok || !Array.isArray(deck.nodes)) {
        return { myNodes: [] as const };
      }
      return { myNodes: deck.nodes };
    },
  });
}
