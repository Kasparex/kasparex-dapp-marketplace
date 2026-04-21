import { useQuery } from '@tanstack/react-query';
import { fetchNodeEpochReward, fetchWalletNodes } from '@/lib/nodes/operatorApi';

function todayEpoch(): string {
  return new Date().toISOString().split('T')[0]!;
}

/**
 * Loads nodes registered to the connected Kaspa wallet and sums today's GRID epoch accrual from the Worker API.
 */
export function useKrexOperatorDashboard(kaspaAddress: string | null | undefined) {
  return useQuery({
    queryKey: ['krex-operator-dashboard', kaspaAddress ?? ''],
    enabled: Boolean(kaspaAddress?.trim()),
    staleTime: 20_000,
    queryFn: async () => {
      const addr = kaspaAddress!.trim();
      const deck = await fetchWalletNodes(addr);
      if (!deck.ok || !Array.isArray(deck.nodes)) {
        return { myNodes: [] as const, gridEarnedToday: 0 };
      }
      const epoch = todayEpoch();
      let gridEarnedToday = 0;
      for (const n of deck.nodes) {
        try {
          const r = await fetchNodeEpochReward(n.node_id, epoch);
          gridEarnedToday += Number(r.final_grid ?? 0) || 0;
        } catch {
          // ignore per-node errors (e.g. not registered yet)
        }
      }
      return { myNodes: deck.nodes, gridEarnedToday };
    },
  });
}
