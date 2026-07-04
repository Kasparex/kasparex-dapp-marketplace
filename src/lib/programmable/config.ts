/**
 * Programmable L1 asset config (KCC-20 / covenant tokens).
 * Read-only kascov enrichment; no Hub indexer.
 */

export type ProgrammableNetworkId = 'testnet-10' | 'mainnet';

export const KASCOV_BASE_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_KASCOV_BASE?.trim()) ||
  'https://kascov-explorer.web.app';

export const DEFAULT_PROGRAMMABLE_NETWORK: ProgrammableNetworkId =
  (process.env.NEXT_PUBLIC_KCC20_NETWORK as ProgrammableNetworkId | undefined) ?? 'testnet-10';

export function kascovDataUrl(network: ProgrammableNetworkId, path: string): string {
  const base = KASCOV_BASE_URL.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}/data/${network}${normalized}`;
}

export function kascovCovenantExplorerUrl(covenantId: string, network: ProgrammableNetworkId): string {
  const base = KASCOV_BASE_URL.replace(/\/$/, '');
  return `${base}/#/c/${encodeURIComponent(covenantId)}?network=${network}`;
}

export function kascovDecodeUrl(scriptHex?: string): string {
  const base = KASCOV_BASE_URL.replace(/\/$/, '');
  if (!scriptHex?.trim()) return `${base}/#/decode`;
  return `${base}/#/decode?script=${encodeURIComponent(scriptHex.trim())}`;
}
