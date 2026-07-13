import { useQuery } from '@tanstack/react-query';
import { getKrexNodes, type KrexNode } from '@/lib/storage/krex-nodes';

export function useKrexNodeNetwork(options?: { role?: KrexNode['role']; region?: string }) {
  return useQuery({
    queryKey: ['krex-nodes', options?.role ?? 'all', options?.region ?? 'all'],
    queryFn: async () => {
      const all = await getKrexNodes({ region: options?.region, role: options?.role });
      if (options?.role) return all;
      const roles = new Set<KrexNode['role']>(['edge', 'light', 'super']);
      const dedup = new Map<string, KrexNode>();
      for (const n of all) {
        if (n?.url && roles.has(n.role)) dedup.set(n.url, n);
      }
      return Array.from(dedup.values());
    },
    staleTime: 120_000,
    refetchInterval: 120_000,
  });
}
