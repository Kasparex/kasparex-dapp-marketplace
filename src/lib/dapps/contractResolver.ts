/**
 * Resolves dApp slug/id to the contract name used in getContractAddress.
 * Single place for "which contract per dApp" so components don't branch on slug.
 */

import type { DApp } from '@/lib/dapps';
import { getDAppChainIds, getDAppNetworkType } from '@/lib/dapps';
import { getChainById } from '@/lib/wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';

type DAppContractName =
  | 'SimplePayment'
  | 'DAOVoting'
  | 'PlatformSubscription'
  | 'QuizToEarn'
  | 'SubscriptionManager'
  | 'DAppSubscription'
  | 'GenesisBadge';

const SLUG_TO_CONTRACT: Record<string, DAppContractName> = {
  'simple-payment': 'SimplePayment',
  'dao-voting': 'DAOVoting',
  'platform-subscription': 'PlatformSubscription',
  'quiz-to-earn': 'QuizToEarn',
  'subscription': 'SubscriptionManager',
  'dapp-subscription': 'DAppSubscription',
  'genesis-badge': 'GenesisBadge',
};

/**
 * Get the dApp's contract address for the current chain.
 * Uses dapp.slug or dapp.id to look up the contract name, then getContractAddress(chainId, name).
 * Returns dapp.contractAddress if the dApp has one set and no mapping exists.
 */
export function getDAppContractAddress(dapp: DApp, chainId: number): string {
  const slug = (dapp.slug ?? dapp.id?.toLowerCase?.()?.replace(/\s+/g, '-')) ?? '';
  const contractName = SLUG_TO_CONTRACT[slug];
  if (contractName) {
    const address = getContractAddress(chainId, contractName);
    if (address) return address;
  }
  if (dapp.contractAddress) return dapp.contractAddress;
  return '';
}

/**
 * Get contract address by dApp slug when you don't have a full DApp object (e.g. Activity filter).
 */
export function getDAppContractAddressBySlug(slug: string, chainId: number): string {
  const contractName = SLUG_TO_CONTRACT[slug];
  if (!contractName) return '';
  return getContractAddress(chainId, contractName) || '';
}

/**
 * Chain IDs where this dApp has a mapped deployed contract (env / hardcoded registry) for that chain.
 * L2 only: filters declared `supportedChainIds` (or inferred networks) to chains with a non-empty address.
 * L1 returns [] (no EVM contract registry semantics here).
 * Unmapped slugs with a single explicit `dapp.contractAddress` count as deployed on that sole supported chain.
 */
export function getDAppDeployedChainIds(dapp: DApp): number[] {
  if (getDAppNetworkType(dapp) !== 'L2') {
    return [];
  }
  const chainIds = getDAppChainIds(dapp);
  const slug = (dapp.slug ?? dapp.id?.toLowerCase?.()?.replace(/\s+/g, '-')) ?? '';
  const contractName = SLUG_TO_CONTRACT[slug];
  if (contractName) {
    return chainIds.filter((id) => {
      const address = getContractAddress(id, contractName);
      return Boolean(address && address.startsWith('0x'));
    });
  }
  if (dapp.contractAddress?.startsWith('0x') && chainIds.length === 1) {
    return chainIds;
  }
  return [];
}

/** Preferred chain for gating, badges, and switch-network prompts (deployed chain first). */
export function getDAppPrimaryChainId(dapp: DApp): number | undefined {
  const deployed = getDAppDeployedChainIds(dapp);
  const candidates = deployed.length > 0 ? deployed : getDAppChainIds(dapp);
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  const networkLower = (dapp.network || '').toLowerCase();
  const preferTestnet = networkLower.includes('testnet') && !networkLower.includes('mainnet');

  const familyMatch = (id: number) => {
    const name = (getChainById(id)?.name ?? '').toLowerCase();
    if (networkLower.includes('kasplex')) return name.includes('kasplex');
    if (networkLower.includes('igra') || networkLower.includes('galleon')) return name.includes('igra');
    return true;
  };

  const family = candidates.filter(familyMatch);
  const pool = family.length > 0 ? family : candidates;

  const scored = [...pool].sort((a, b) => {
    const na = (getChainById(a)?.name ?? '').toLowerCase();
    const nb = (getChainById(b)?.name ?? '').toLowerCase();
    const score = (n: string) => {
      const isTestnet = n.includes('testnet');
      const isMainnet = n.includes('mainnet');
      if (preferTestnet) return isTestnet ? 0 : isMainnet ? 2 : 1;
      return isMainnet && !isTestnet ? 0 : isTestnet ? 2 : 1;
    };
    return score(na) - score(nb) || na.localeCompare(nb);
  });

  return scored[0];
}

export function getDAppPrimaryChainName(dapp: DApp): string {
  const id = getDAppPrimaryChainId(dapp);
  if (id === undefined) return dapp.network || 'L2';
  return getChainById(id)?.name ?? `Chain ${id}`;
}
