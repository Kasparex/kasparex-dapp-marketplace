import { getChainById } from '@/lib/wagmi';

export type HubNetworkLayer = 'L1' | 'L2' | 'either';

export type HubGateReason =
  | 'open'
  | 'l1_wallet_required'
  | 'l2_wallet_required'
  | 'l2_chain_mismatch'
  | 'either_wallet_required';

export interface HubAccessRequirement {
  layer: HubNetworkLayer;
  chainIds?: number[];
}

export interface HubNetworkBadgeConfig {
  layer: HubNetworkLayer;
  label: string;
  testnet?: boolean;
}

export interface HubAccessInput {
  requirement: HubAccessRequirement;
  isKaspaConnected: boolean;
  isEvmConnected: boolean;
  chainId?: number;
}

export interface HubAccessResult {
  isOpenable: boolean;
  reason: HubGateReason;
  requiredChainNames: string[];
}

function isChainCompatible(chainIds: number[], chainId: number): boolean {
  if (chainIds.length === 0) return true;
  return chainIds.includes(chainId);
}

export function getHubRequiredChainNames(chainIds: number[] = []): string[] {
  return chainIds.map((id) => getChainById(id)?.name || `Chain ${id}`);
}

export function evaluateHubAccess(input: HubAccessInput): HubAccessResult {
  const { requirement, isKaspaConnected, isEvmConnected, chainId } = input;
  const chainIds = requirement.chainIds ?? [];
  const requiredChainNames = getHubRequiredChainNames(chainIds);

  if (requirement.layer === 'either') {
    if (isKaspaConnected || isEvmConnected) {
      return { isOpenable: true, reason: 'open', requiredChainNames };
    }
    return { isOpenable: false, reason: 'either_wallet_required', requiredChainNames };
  }

  if (requirement.layer === 'L1') {
    if (!isKaspaConnected) {
      return { isOpenable: false, reason: 'l1_wallet_required', requiredChainNames };
    }
    return { isOpenable: true, reason: 'open', requiredChainNames };
  }

  if (!isEvmConnected) {
    return { isOpenable: false, reason: 'l2_wallet_required', requiredChainNames };
  }

  if (chainId === undefined || !isChainCompatible(chainIds, chainId)) {
    return { isOpenable: false, reason: 'l2_chain_mismatch', requiredChainNames };
  }

  return { isOpenable: true, reason: 'open', requiredChainNames };
}

export function getHubGateMessage(reason: HubGateReason, requiredChainNames: string[]): string {
  switch (reason) {
    case 'l1_wallet_required':
      return 'Connect a Kaspa L1 wallet to continue.';
    case 'l2_wallet_required':
      return 'Connect an EVM wallet to continue.';
    case 'either_wallet_required':
      return 'Connect a Kaspa L1 or EVM wallet to continue.';
    case 'l2_chain_mismatch':
      return requiredChainNames.length > 1
        ? 'Switch your wallet to a supported network to continue.'
        : requiredChainNames.length > 0
          ? `Switch your wallet to ${requiredChainNames[0]} to continue.`
          : 'Switch your wallet to a supported L2 network to continue.';
    default:
      return 'A wallet connection is required to continue.';
  }
}

export function getHubGateOverlaySubtitle(reason: HubGateReason): string {
  switch (reason) {
    case 'l2_chain_mismatch':
      return 'Click to change network';
    case 'l2_wallet_required':
    case 'l1_wallet_required':
    case 'either_wallet_required':
      return 'Click to connect';
    default:
      return 'Click to continue';
  }
}

export function hubLayerToBadgeKind(
  layer: HubNetworkLayer,
  label: string,
  testnet = false
): 'kaspa_mainnet' | 'kaspa_testnet' | 'l2_mainnet' | 'l2_testnet' | 'neutral' {
  if (layer === 'either') return 'neutral';
  const lower = label.toLowerCase();
  if (layer === 'L1') {
    if (lower.includes('kaspa') && lower.includes('mainnet')) return 'kaspa_mainnet';
    if (testnet || lower.includes('testnet') || lower.includes('vprogs') || lower.includes('simulator')) {
      return 'kaspa_testnet';
    }
    return testnet ? 'kaspa_testnet' : 'kaspa_mainnet';
  }
  if (testnet || lower.includes('testnet')) return 'l2_testnet';
  if (lower.includes('mainnet')) return 'l2_mainnet';
  return testnet ? 'l2_testnet' : 'l2_mainnet';
}
