/**
 * Node-first API routing
 *
 * For read-heavy endpoints, prefer community nodes (mirror/light) first,
 * then fall back to the central Kasparex API.
 *
 * This keeps user UX fast while pushing bandwidth/compute to the node network.
 */

import { apiClient } from '@/lib/api/client';
import type { KrexNode } from '@/lib/storage/krex-nodes';
import { fetchJsonWithTimeout, getKrexNodes } from '@/lib/storage/krex-nodes';

export type NodeFirstMode = 'node_first' | 'central_only';

export interface NodeFirstGetOptions {
  mode?: NodeFirstMode;
  /** Prefer these roles in order. Defaults to mirror->light. */
  roles?: KrexNode['role'][];
  /** Optional region hint (e.g. 'eu', 'na'). */
  region?: string;
  /** How many nodes to try before falling back. */
  maxNodeAttempts?: number;
  /** Per-node request timeout. */
  timeoutMs?: number;
}

function scoreNode(node: KrexNode, opts: { region?: string; rolePriority: KrexNode['role'][] }): number {
  const roleIndex = opts.rolePriority.indexOf(node.role);
  const roleScore = roleIndex === -1 ? 0 : (opts.rolePriority.length - roleIndex) * 1000;
  const regionScore = opts.region && node.region === opts.region ? 250 : 0;
  // uptime_hours is stored as "uptime" in the krex-nodes client mapping
  const uptimeScore = Math.max(0, Math.min(10_000, Math.floor((node.uptime ?? 0) * 10)));
  return roleScore + regionScore + uptimeScore;
}

async function getCandidateNodes(opts: NodeFirstGetOptions): Promise<KrexNode[]> {
  const roles = opts.roles?.length ? opts.roles : (['mirror', 'light'] as KrexNode['role'][]);
  const region = opts.region;

  // Single registry fetch when no role filter; filter/sort client-side.
  const allNodes = await getKrexNodes({ region });
  const roleSet = new Set(roles);

  const dedup = new Map<string, KrexNode>();
  for (const n of allNodes) {
    if (!n?.url || !roleSet.has(n.role)) continue;
    dedup.set(n.url, n);
  }

  return Array.from(dedup.values()).sort(
    (a, b) => scoreNode(b, { region, rolePriority: roles }) - scoreNode(a, { region, rolePriority: roles })
  );
}

/**
 * GET JSON from nodes first, then central fallback.
 *
 * Endpoint must be a Kasparex API path like `/kasparex/stats` or `/kasparex/rewards/l1/...`.
 */
export async function nodeFirstGet<T>(
  endpoint: string,
  options?: NodeFirstGetOptions
): Promise<{ data: T; source: 'node' | 'central'; nodeUrl?: string }> {
  const mode = options?.mode ?? 'node_first';
  const maxNodeAttempts = Math.max(0, options?.maxNodeAttempts ?? 3);
  const timeoutMs = Math.max(800, options?.timeoutMs ?? 3500);

  if (mode === 'node_first') {
    const candidates = await getCandidateNodes(options ?? {});
    for (const node of candidates.slice(0, maxNodeAttempts)) {
      const base = node.url?.replace(/\/$/, '');
      if (!base) continue;
      const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      try {
        const data = await fetchJsonWithTimeout<T>(url, { timeoutMs });
        return { data, source: 'node', nodeUrl: base };
      } catch {
        // try next node
      }
    }
  }

  // Central fallback (uses the same base URL as the existing API client).
  const data = await apiClient.get<T>(endpoint);
  return { data, source: 'central' };
}

