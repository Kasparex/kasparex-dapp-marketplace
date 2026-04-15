export function shortenAddress(addr: string, opts?: { head?: number; tail?: number }): string {
  const head = opts?.head ?? 6;
  const tail = opts?.tail ?? 4;
  if (!addr) return '';
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

export type WalletExplorerTarget =
  | { kind: 'kaspa-l1'; address: string }
  | { kind: 'evm'; address: string; chainExplorerBaseUrl?: string };

export function getAddressExplorerUrl(target: WalletExplorerTarget): string | null {
  if (target.kind === 'kaspa-l1') {
    const addressWithoutPrefix = target.address.replace(/^kaspa:/i, '');
    if (!addressWithoutPrefix) return null;
    return `https://explorer.kaspa.org/addresses/${addressWithoutPrefix}`;
  }

  const addr = target.address;
  if (!addr) return null;

  const base = target.chainExplorerBaseUrl?.replace(/\/+$/, '') || '';
  if (!base) return null;

  // Most EVM explorers support /address/:address
  return `${base}/address/${addr}`;
}

/**
 * UI-native currency label.
 * - IGRA uses iKAS natively (already in chain config).
 * - Kasplex native currency is KAS, but the UI wants to communicate "wrapped" KAS usage on L2.
 */
export function getUiNativeSymbol(chainId: number | null | undefined, fallback: string): string {
  if (!chainId) return fallback;
  if (chainId === 202555 || chainId === 167012) return 'wKAS';
  return fallback;
}

export const BRIDGE_URLS = {
  kasplexKasBridge: 'https://kasbridge-evm.kaspafoundation.org/',
  igraIkasBridge: 'https://ikas.katbridge.com/',
  katBridge: 'https://katbridge.com/',
  nftBridge: 'https://nft.katbridge.com/',
} as const;

export function getNetworkBridgeUrl(chainId: number | null | undefined): string {
  // Kasplex
  if (chainId === 202555 || chainId === 167012) return BRIDGE_URLS.kasplexKasBridge;
  // IGRA
  if (chainId === 38836 || chainId === 38833) return BRIDGE_URLS.igraIkasBridge;
  return BRIDGE_URLS.katBridge;
}

