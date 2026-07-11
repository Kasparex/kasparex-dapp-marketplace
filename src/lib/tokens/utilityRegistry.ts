/**
 * Hub utility registry: map token projects to Kasparex product integrations.
 */

import type { Token } from './types';
import type { TokenModuleId } from './modules';
import { isProgrammableOnlyModule } from './modules';
import { canUseIntegrationUtility } from './utilityEligibility';

export type HubUtilityProductId =
  | 'store'
  | 'vdonations'
  | 'vblog_tips'
  | 'crowdkas'
  | 'dapps_payments'
  | 'magazines'
  | 'games';

export type HubUtilityProduct = {
  id: HubUtilityProductId;
  label: string;
  description: string;
  href: string;
  badge: string;
};

export const HUB_UTILITY_PRODUCTS: HubUtilityProduct[] = [
  {
    id: 'store',
    label: 'Kasparex Store',
    description: 'Accept your token in product checkout and seller listings.',
    href: '/store',
    badge: 'Payments',
  },
  {
    id: 'vdonations',
    label: 'vDonations',
    description: 'Let supporters donate using your token in campaign flows.',
    href: '/dapps/vdonations',
    badge: 'Donations',
  },
  {
    id: 'vblog_tips',
    label: 'vBlog Tips',
    description: 'Enable tipping on articles and creator pages with your token.',
    href: '/vblog',
    badge: 'Tips',
  },
  {
    id: 'crowdkas',
    label: 'vDonate',
    description: 'Run crowdfunding campaigns that accept your token.',
    href: '/dapps/crowdkas',
    badge: 'Crowdfunding',
  },
  {
    id: 'dapps_payments',
    label: 'dApp Payments',
    description: 'Surface your token in Kasparex dApp payment dropdowns.',
    href: '/dapps',
    badge: 'dApps',
  },
  {
    id: 'magazines',
    label: 'Magazines',
    description: 'Sell magazine issues and accept your token at checkout.',
    href: '/magazines',
    badge: 'Publishing',
  },
  {
    id: 'games',
    label: 'Kasparex Games',
    description: 'Use your token for in-game purchases and rewards.',
    href: '/games',
    badge: 'Games',
  },
];

export function getHubUtilityProduct(id: HubUtilityProductId): HubUtilityProduct | undefined {
  return HUB_UTILITY_PRODUCTS.find((p) => p.id === id);
}

export function resolveTokenUtilityProducts(token: Token): HubUtilityProduct[] {
  if (!canUseIntegrationUtility(token)) return [];
  const ids = token.modulesConfig?.utilityProducts ?? [];
  if (ids.length === 0 && token.listing?.instantUtility) {
    return HUB_UTILITY_PRODUCTS.slice(0, 3);
  }
  return ids
    .map((id) => getHubUtilityProduct(id as HubUtilityProductId))
    .filter((p): p is HubUtilityProduct => Boolean(p));
}

export function buildUtilityBadgesFromProducts(productIds: string[]): string[] {
  const badges = new Set<string>();
  for (const id of productIds) {
    const product = getHubUtilityProduct(id as HubUtilityProductId);
    if (product) badges.add(product.badge);
  }
  return Array.from(badges);
}

const PROGRAMMABLE_MODULE_BADGES: Partial<Record<TokenModuleId, string>> = {
  covenant_utilities_hub: 'Covenant Utilities',
  access_gate: 'Gated',
  native_subscriptions: 'Subscriptions',
};

export function buildProgrammableModuleBadges(moduleIds: TokenModuleId[]): string[] {
  const badges = new Set<string>();
  for (const id of moduleIds) {
    if (!isProgrammableOnlyModule(id)) continue;
    const badge = PROGRAMMABLE_MODULE_BADGES[id];
    if (badge) badges.add(badge);
  }
  return Array.from(badges);
}

export function tokenHasPaidModule(token: Token, moduleId: TokenModuleId): boolean {
  return (token.paidModuleIds ?? []).includes(moduleId);
}
