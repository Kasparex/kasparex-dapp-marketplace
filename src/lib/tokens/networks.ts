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
import {
  DEFAULT_PROGRAMMABLE_NETWORK,
  kascovCovenantExplorerUrl,
  type ProgrammableNetworkId,
} from '@/lib/programmable/config';

export type TokenNetworkFilter = 'all' | 'L1' | 'L2' | 'MULTI';

const KASPLEX_EXPLORER = 'https://explorer.kasplex.org/address';
const IGRA_EXPLORER = 'https://explorer.igralabs.com/address';

/** Full network name for detail views and tooltips. */
export function getNetworkChipLabel(network: TokenListingNetwork): string {
  return getListingNetworkLabel(network);
}

/** Compact chip label for cards and headers (KRC20, KCC20, L1, L2). */
export function getNetworkChipShortLabel(network: TokenListingNetwork): string {
  switch (network) {
    case 'krc20':
      return 'KRC20';
    case 'kcc20':
      return 'KCC20';
    case 'kaspa_l1':
      return 'L1';
    case 'l2_kasplex':
    case 'l2_igra':
      return 'L2';
    default:
      return getListingNetworkLabel(network);
  }
}

/** Distinct tier-style pill colors per network type (stronger contrast). */
export function getNetworkChipStyleClasses(network: TokenListingNetwork): string {
  switch (network) {
    case 'krc20':
      return 'bg-amber-200 text-amber-950 dark:bg-amber-500/35 dark:text-amber-100';
    case 'kcc20':
      return 'bg-violet-200 text-violet-950 dark:bg-violet-500/35 dark:text-violet-100';
    case 'kaspa_l1':
      return 'bg-teal-200 text-teal-950 dark:bg-teal-500/35 dark:text-teal-100';
    case 'l2_kasplex':
      return 'bg-sky-200 text-sky-950 dark:bg-sky-500/35 dark:text-sky-100';
    case 'l2_igra':
      return 'bg-indigo-200 text-indigo-950 dark:bg-indigo-500/35 dark:text-indigo-100';
    default:
      return 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200';
  }
}

export function getNetworkChipTooltip(
  network: TokenListingNetwork,
  entry: { primary?: boolean; verified?: boolean },
): string {
  const full = getListingNetworkLabel(network);
  const status = entry.primary
    ? entry.verified
      ? 'Primary network (verified on-chain)'
      : 'Primary network'
    : entry.verified
      ? 'Linked network (verified on-chain)'
      : 'Linked network (unverified)';
  return `${full}: ${status}`;
}

export function getNetworkAddressPlaceholder(network: TokenListingNetwork): string {
  if (network === 'kcc20') return '64-char covenant id or genesis tx id';
  return isL2EvmNetwork(network) ? '0x…' : 'kaspa:…';
}

export function getProgrammableExplorerUrl(
  covenantId: string | undefined,
  network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK,
): string | null {
  const id = covenantId?.trim().toLowerCase();
  if (!id || !/^[a-f0-9]{64}$/.test(id)) return null;
  return kascovCovenantExplorerUrl(id, network);
}

export function getNetworkExplorerUrl(
  network: TokenListingNetwork,
  address: string | undefined,
): string | null {
  const addr = address?.trim();
  if (!addr) return null;
  if (network === 'kcc20') {
    return getProgrammableExplorerUrl(addr.replace(/^kaspa:/i, ''), DEFAULT_PROGRAMMABLE_NETWORK);
  }
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
