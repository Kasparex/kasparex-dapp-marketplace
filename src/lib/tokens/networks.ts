/**
 * Multi-network token helpers: normalize entries, chip labels, explorer URLs.
 */

import type { Token } from './types';
import type { TokenNetworkEntry } from './listingRecord';
import type { TokenListingNetwork } from './listingNetwork';
import {
  getListingNetworkLabel,
  isKaspaL1Network,
  isL2EvmNetwork,
  tokenNetworkToListingNetwork,
} from './listingNetwork';

export type TokenNetworkFilter = 'all' | 'L1' | 'L2' | 'MULTI';

const KASPLEX_EXPLORER = 'https://explorer.kasplex.org/address';
const IGRA_EXPLORER = 'https://explorer.igralabs.com/address';

/** Short chip label for UI (cards, headers). */
export function getNetworkChipLabel(network: TokenListingNetwork): string {
  switch (network) {
    case 'krc20':
      return 'KRC-20';
    case 'kaspa_l1':
      return 'Kaspa L1';
    case 'kcc20':
      return 'KCC-20';
    case 'l2_kasplex':
      return 'Kasplex L2';
    case 'l2_igra':
      return 'Igra L2';
    default:
      return getListingNetworkLabel(network);
  }
}

export function getNetworkAddressPlaceholder(network: TokenListingNetwork): string {
  return isL2EvmNetwork(network) ? '0x…' : 'kaspa:…';
}

export function getNetworkExplorerUrl(
  network: TokenListingNetwork,
  address: string | undefined,
): string | null {
  const addr = address?.trim();
  if (!addr) return null;
  if (isL2EvmNetwork(network)) {
    if (network === 'l2_igra') return `${IGRA_EXPLORER}/${addr}`;
    return `${KASPLEX_EXPLORER}/${addr}`;
  }
  if (isKaspaL1Network(network)) {
    return `https://kas.fyi/address/${addr.replace(/^kaspa:/i, '')}`;
  }
  return null;
}

/**
 * Normalize token network entries from `networks[]` or legacy single-network fields.
 */
export function getTokenNetworkEntries(token: Token): TokenNetworkEntry[] {
  if (token.networks && token.networks.length > 0) {
    return token.networks.map((entry, index) => ({
      ...entry,
      primary: entry.primary ?? index === 0,
    }));
  }

  const entries: TokenNetworkEntry[] = [];
  const primaryNetwork = tokenNetworkToListingNetwork(token.network, token.contractAddress);
  const deployerVerified = Boolean(token.listing?.deployerVerified);

  if (token.contractAddress || primaryNetwork) {
    entries.push({
      network: primaryNetwork,
      contractAddress: token.contractAddress,
      primary: true,
      verified: deployerVerified,
    });
  }

  if (token.l1Address && !entries.some((e) => e.contractAddress === token.l1Address)) {
    entries.push({
      network: 'krc20',
      contractAddress: token.l1Address,
      primary: primaryNetwork === 'krc20' || primaryNetwork === 'kaspa_l1',
      verified: deployerVerified && (primaryNetwork === 'krc20' || primaryNetwork === 'kaspa_l1'),
    });
  }

  if (token.l2Address && !entries.some((e) => e.contractAddress === token.l2Address)) {
    entries.push({
      network: 'l2_kasplex',
      contractAddress: token.l2Address,
      primary: primaryNetwork === 'l2_kasplex' || primaryNetwork === 'l2_igra',
      verified: deployerVerified && (primaryNetwork === 'l2_kasplex' || primaryNetwork === 'l2_igra'),
    });
  }

  return entries;
}

export function tokenAvailableOnL1(token: Token): boolean {
  const entries = getTokenNetworkEntries(token);
  return entries.some((e) => isKaspaL1Network(e.network)) || token.network === 'L1';
}

export function tokenAvailableOnL2(token: Token): boolean {
  const entries = getTokenNetworkEntries(token);
  return entries.some((e) => isL2EvmNetwork(e.network)) || token.network === 'L2';
}

export function tokenSpansMultipleNetworks(token: Token): boolean {
  const entries = getTokenNetworkEntries(token);
  if (entries.length > 1) return true;
  return tokenAvailableOnL1(token) && tokenAvailableOnL2(token);
}

export function matchesTokenNetworkFilter(token: Token, filter: TokenNetworkFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'MULTI') return tokenSpansMultipleNetworks(token);
  if (filter === 'L1') return tokenAvailableOnL1(token);
  if (filter === 'L2') return tokenAvailableOnL2(token);
  return true;
}

/** Build networks[] from primary + secondary rows for listing publish. */
export function buildNetworkEntries(args: {
  primaryNetwork: TokenListingNetwork;
  primaryAddress?: string;
  primaryVerified?: boolean;
  secondaryNetworks?: Array<{ network: TokenListingNetwork; contractAddress?: string }>;
}): TokenNetworkEntry[] {
  const entries: TokenNetworkEntry[] = [
    {
      network: args.primaryNetwork,
      contractAddress: args.primaryAddress?.trim() || undefined,
      primary: true,
      verified: args.primaryVerified ?? false,
    },
  ];

  for (const row of args.secondaryNetworks ?? []) {
    const addr = row.contractAddress?.trim();
    if (!addr) continue;
    if (row.network === args.primaryNetwork) continue;
    if (entries.some((e) => e.network === row.network)) continue;
    entries.push({
      network: row.network,
      contractAddress: addr,
      primary: false,
      verified: false,
    });
  }

  return entries;
}

/** Networks available as secondary (excludes primary and disabled). */
export function getSecondaryNetworkOptions(primaryNetwork: TokenListingNetwork): TokenListingNetwork[] {
  const all: TokenListingNetwork[] = ['krc20', 'kaspa_l1', 'l2_kasplex', 'l2_igra'];
  return all.filter((n) => n !== primaryNetwork && n !== 'kcc20');
}
