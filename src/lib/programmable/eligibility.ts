import type { Token } from '@/lib/tokens/types';
import type { TokenListingNetwork } from '@/lib/tokens/listingNetwork';
import type { TokenOnChainSnapshot } from '@/lib/tokens/listingRecord';
import { tokenHasModule, type TokenModuleId } from '@/lib/tokens/modules';
import { canUseIntegrationUtility, hasDeployerVerification } from '@/lib/tokens/utilityEligibility';

export const PROGRAMMABLE_MODULE_IDS: TokenModuleId[] = [
  'covenant_utilities_hub',
  'access_gate',
  'native_subscriptions',
];

export function isProgrammableListingNetwork(network: TokenListingNetwork | undefined): boolean {
  return network === 'kcc20';
}

export function isProgrammableOnChainSnapshot(
  snapshot: TokenOnChainSnapshot | undefined,
): snapshot is TokenOnChainSnapshot & { source: 'kcc20' } {
  return snapshot?.source === 'kcc20';
}

export function getTokenListingNetwork(token: Token): TokenListingNetwork | undefined {
  const primary = token.networks?.find((n) => n.primary) ?? token.networks?.[0];
  return primary?.network ?? token.listingNetwork;
}

export function isProgrammableToken(token: Token): boolean {
  if (token.onChainSnapshot?.source === 'kcc20') return true;
  return isProgrammableListingNetwork(getTokenListingNetwork(token));
}

export function canUseProgrammableUtility(token: Token): boolean {
  return isProgrammableToken(token) && canUseIntegrationUtility(token);
}

export function tokenHasProgrammableModule(token: Token, moduleId: TokenModuleId): boolean {
  return tokenHasModule(token.paidModuleIds, moduleId);
}

export function tokenHasAnyProgrammableModule(token: Token): boolean {
  return PROGRAMMABLE_MODULE_IDS.some((id) => tokenHasProgrammableModule(token, id));
}

export function canShowProgrammableUtilitySection(token: Token): boolean {
  if (!canUseProgrammableUtility(token)) return false;
  return tokenHasAnyProgrammableModule(token);
}

export function resolveProgrammableCovenantId(token: Token): string | undefined {
  const snap = token.onChainSnapshot;
  if (snap?.source === 'kcc20' && snap.covenantId) return snap.covenantId;
  const primary = token.networks?.find((n) => n.primary) ?? token.networks?.[0];
  if (primary?.network === 'kcc20' && primary.contractAddress) {
    return primary.contractAddress.replace(/^kaspa:/i, '').trim();
  }
  if (token.contractAddress && isProgrammableToken(token)) {
    return token.contractAddress.replace(/^kaspa:/i, '').trim();
  }
  return undefined;
}

export function programmableDeployerVerified(token: Token): boolean {
  return isProgrammableToken(token) && hasDeployerVerification(token);
}
