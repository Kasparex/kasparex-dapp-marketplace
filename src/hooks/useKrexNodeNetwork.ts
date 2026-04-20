import { useQuery } from '@tanstack/react-query';
import { getKrexNodes, type KrexNode } from '@/lib/storage/krex-nodes';

export function useKrexNodeNetwork(options?: { role?: KrexNode['role']; region?: string }) {
  return useQuery({
    queryKey: ['krex-nodes', options?.role ?? 'all', options?.region ?? 'all'],
    queryFn: async () => {
      if (options?.role) return await getKrexNodes({ role: options.role, region: options.region });
      // When role isn't specified, merge common roles in a stable order.
      const [mirror, light, superNodes] = await Promise.all([
        getKrexNodes({ role: 'mirror', region: options?.region }),
        getKrexNodes({ role: 'light', region: options?.region }),
        getKrexNodes({ role: 'super', region: options?.region }),
      ]);
      const dedup = new Map<string, KrexNode>();
      for (const n of [...mirror, ...light, ...superNodes]) {
        if (n?.url) dedup.set(n.url, n);
      }
      return Array.from(dedup.values());
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

