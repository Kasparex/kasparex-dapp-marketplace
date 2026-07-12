export type ProxyCacheProfile =
  | 'balance'
  | 'indexerBalance'
  | 'indexerMeta'
  | 'nftStream'
  | 'nftMeta'
  | 'kns';

const PROFILES: Record<ProxyCacheProfile, { sMaxAge: number; swr: number }> = {
  balance: { sMaxAge: 30, swr: 120 },
  indexerBalance: { sMaxAge: 60, swr: 300 },
  indexerMeta: { sMaxAge: 300, swr: 600 },
  nftStream: { sMaxAge: 120, swr: 600 },
  nftMeta: { sMaxAge: 300, swr: 600 },
  kns: { sMaxAge: 300, swr: 600 },
};

export function proxyCacheControl(profile: ProxyCacheProfile, opts?: { noStore?: boolean }): string {
  if (opts?.noStore) return 'no-store';
  const p = PROFILES[profile];
  return `public, s-maxage=${p.sMaxAge}, stale-while-revalidate=${p.swr}`;
}

export function kasplexCacheProfile(endpoint: string): ProxyCacheProfile {
  if (/\/address\//.test(endpoint) || /\/balance/.test(endpoint)) {
    return 'indexerBalance';
  }
  return 'indexerMeta';
}

export function corsProxyHeaders(
  profile: ProxyCacheProfile,
  extra?: Record<string, string>,
  opts?: { noStore?: boolean },
): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': proxyCacheControl(profile, opts),
    ...extra,
  };
}
