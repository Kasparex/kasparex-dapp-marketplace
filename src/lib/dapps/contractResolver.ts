/**
 * Resolves dApp slug/id to the contract name used in getContractAddress.
 * Single place for "which contract per dApp" so components don't branch on slug.
 */

import type { DApp } from '@/lib/dapps';
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
