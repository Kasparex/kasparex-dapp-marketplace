/**
 * Programmable L1 asset config (KCC-20 / covenant tokens).
 * Read-only enrichment via KaspaCom indexer with kascov fallback; no Hub indexer.
 */

export type ProgrammableNetworkId = 'testnet-10' | 'mainnet';

/** Canonical kascov site and JSON API base. Override with NEXT_PUBLIC_KASCOV_BASE. */
export const KASCOV_BASE_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_KASCOV_BASE?.trim()) ||
  'https://kascov.io';

/**
 * Default for indexer / explorer links when no wallet address is available.
 * Hub LockBox UI targets mainnet; override with NEXT_PUBLIC_KCC20_NETWORK=testnet-10 for TN10.
 */
export const DEFAULT_PROGRAMMABLE_NETWORK: ProgrammableNetworkId =
  (process.env.NEXT_PUBLIC_KCC20_NETWORK as ProgrammableNetworkId | undefined) ?? 'mainnet';

/** Infer WASM / covenant network from a Kaspa address prefix. */
export function programmableNetworkFromAddress(
  address: string | null | undefined,
): ProgrammableNetworkId | null {
  const a = (address ?? '').trim().toLowerCase();
  if (!a) return null;
  if (a.startsWith('kaspa:')) return 'mainnet';
  if (a.startsWith('kaspatest:')) return 'testnet-10';
  return null;
}

/**
 * Resolve the network for covenant deploy/spend builders.
 * Prefer the connected wallet address prefix so createTransactions never gets
 * a mainnet `kaspa:` change address with `testnet-10` (WASM: "Change address
 * does not match supplied network type").
 */
export function resolveCovenantNetworkId(opts: {
  address?: string | null;
  networkId?: ProgrammableNetworkId | string | null;
}): ProgrammableNetworkId {
  const fromAddr = programmableNetworkFromAddress(opts.address);
  if (fromAddr) return fromAddr;

  const raw = String(opts.networkId ?? '')
    .trim()
    .toLowerCase();
  if (raw === 'mainnet' || raw === 'livenet') return 'mainnet';
  if (
    raw === 'testnet-10' ||
    raw === 'testnet10' ||
    raw === 'tn10' ||
    raw === 'testnet'
  ) {
    return 'testnet-10';
  }
  return DEFAULT_PROGRAMMABLE_NETWORK;
}

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

export function kascovExploreUrl(network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK): string {
  const base = KASCOV_BASE_URL.replace(/\/$/, '');
  return `${base}/#/explore?network=${network}`;
}

export function kascovTemplatesFeedUrl(network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK): string {
  return kascovDataUrl(network, '/templates.json');
}

export function kascovTokensFeedUrl(network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK): string {
  return kascovDataUrl(network, '/tokens.json');
}
