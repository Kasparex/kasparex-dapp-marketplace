/**
 * Rules for which tokens can use real Hub integrations vs informational modules only.
 */

import type { Token } from './types';
import type { TokenAssetKind } from './listingRecord';
import type { TokenModuleId } from './modules';

/** Modules that only affect page presentation (no on-chain token wiring). */
export const TOKEN_INFORMATIONAL_MODULE_IDS: TokenModuleId[] = [
  'roadmap_editor',
  'timeline_builder',
  'featured_listing',
  'highlighted_profile',
];

/** Modules that require a verified real on-chain token connection. */
export const TOKEN_INTEGRATION_MODULE_IDS: TokenModuleId[] = [
  'utility_integrations',
  'premium_analytics',
  'on_chain_poll',
];

export function isInformationalModule(id: TokenModuleId): boolean {
  return TOKEN_INFORMATIONAL_MODULE_IDS.includes(id);
}

export function isIntegrationModule(id: TokenModuleId): boolean {
  return TOKEN_INTEGRATION_MODULE_IDS.includes(id);
}

export function isFictionalToken(token: Pick<Token, 'assetKind' | 'type'>): boolean {
  if (token.type === 'global') return false;
  return token.assetKind === 'fictional' || token.assetKind == null;
}

export function hasDeployerVerification(token: Token): boolean {
  if (token.type === 'global') return true;
  return Boolean(token.listing?.deployerVerified);
}

/** True when the token can wire into Kasparex payments, dApps, and live utility modules. */
export function canUseIntegrationUtility(token: Token): boolean {
  if (isFictionalToken(token)) return false;
  return hasDeployerVerification(token);
}

export function filterModulesForAssetKind(
  moduleIds: TokenModuleId[],
  assetKind: TokenAssetKind,
): TokenModuleId[] {
  if (assetKind === 'real') return moduleIds;
  return moduleIds.filter(isInformationalModule);
}

export function canShowUtilityTab(token: Token): boolean {
  if (!canUseIntegrationUtility(token)) return false;
  return Boolean(
    token.listing?.instantUtility ||
      (token.paidModuleIds ?? []).some((id) => isIntegrationModule(id)),
  );
}
