/**
 * Programmable L1 asset config (KCC-20 / covenant tokens).
 * Read-only enrichment via KaspaCom indexer with kascov fallback; no Hub indexer.
 */

export type ProgrammableNetworkId = 'testnet-10' | 'mainnet';

export const KASCOV_BASE_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_KASCOV_BASE?.trim()) ||
  'https://kascov-explorer.web.app';

export const DEFAULT_PROGRAMMABLE_NETWORK: ProgrammableNetworkId =
  (process.env.NEXT_PUBLIC_KCC20_NETWORK as ProgrammableNetworkId | undefined) ?? 'testnet-10';

const DEFAULT_INDEXER_BY_NETWORK: Record<ProgrammableNetworkId, string> = {
  mainnet: 'https://indexer.kaspa.com',
  'testnet-10': 'https://tn10-indexer.kaspa.com',
};

const DEFAULT_EXPLORER_BY_NETWORK: Record<ProgrammableNetworkId, string> = {
  mainnet: 'https://covenants.kaspa.com',
  'testnet-10': 'https://tn10-covenants.kaspa.com',
};

export function kaspaComIndexerBase(network: ProgrammableNetworkId): string {
  const override = process.env.NEXT_PUBLIC_KASPACOM_INDEXER_BASE?.trim();
  if (override) return override.replace(/\/$/, '');
  return DEFAULT_INDEXER_BY_NETWORK[network];
}

export function kaspaComCovenantExplorerBase(network: ProgrammableNetworkId): string {
  const override = process.env.NEXT_PUBLIC_KASPACOM_COVENANT_EXPLORER?.trim();
  if (override) return override.replace(/\/$/, '');
  return DEFAULT_EXPLORER_BY_NETWORK[network];
}

export function kaspaComCovenantExplorerUrl(
  covenantId: string,
  network: ProgrammableNetworkId,
): string {
  const id = covenantId.trim().toLowerCase();
  return `${kaspaComCovenantExplorerBase(network)}/covenant/${encodeURIComponent(id)}`;
}

export function kaspaComTxExplorerUrl(txid: string, network: ProgrammableNetworkId): string {
  const id = txid.trim().toLowerCase();
  return `${kaspaComCovenantExplorerBase(network)}/tx/${encodeURIComponent(id)}`;
}

/** Primary explorer link for programmable covenants (KaspaCom). */
export function programmableCovenantExplorerUrl(
  covenantId: string,
  network: ProgrammableNetworkId,
): string {
  return kaspaComCovenantExplorerUrl(covenantId, network);
}

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
