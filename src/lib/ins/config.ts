export const INS_API_BASE = 'https://insdomains.org/api';

export const INS_REGISTER_URL = 'https://insdomains.org/';

export const IGRA_MAINNET_CHAIN_ID = 38833;

export const IGRA_GALLEON_TESTNET_CHAIN_ID = 38836;

/** Registry V2 (.igra) — canonical */
export const INS_REGISTRY_V2 = '0x7E7018959bf44045F01D176D8db1594894CBf4E9' as const;

/** ENS-compatible hardened resolver */
export const INS_RESOLVER = '0xcb2A450784849b85A797998EE220dC43d8B3f557' as const;

/** Registry V1 (legacy, read-only) */
export const INS_REGISTRY_V1 = '0x42c2f5AA0c4aACfD07e5fBe65B898212c1c2879c' as const;

export function isInsEnabled(): boolean {
  const raw = String(process.env.NEXT_PUBLIC_INS_ENABLED ?? 'true').trim().toLowerCase();
  return raw !== 'false' && raw !== '0';
}

export function isIgraMainnet(chainId: number | null | undefined): boolean {
  return chainId === IGRA_MAINNET_CHAIN_ID;
}

export function isIgraChain(chainId: number | null | undefined): boolean {
  return chainId === IGRA_MAINNET_CHAIN_ID || chainId === IGRA_GALLEON_TESTNET_CHAIN_ID;
}

export function getInsApiBase(): string {
  const override = String(process.env.NEXT_PUBLIC_INS_API_BASE || '').trim();
  return override || INS_API_BASE;
}

export type InsEndpoint = 'resolve' | 'reverse' | 'names/by-owner';

/** Build upstream INS API URL (must not use `new URL('/path', base)` — that drops `/api`). */
export function getInsUpstreamUrl(
  endpoint: InsEndpoint,
  params: Record<string, string> = {},
): string {
  const base = getInsApiBase().replace(/\/$/, '');
  const url = new URL(`${base}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function getInsProxyUrl(
  endpoint: InsEndpoint,
  origin: string,
  params: Record<string, string> = {},
): string {
  const url = new URL(`/api/ins/${endpoint}`, origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}
