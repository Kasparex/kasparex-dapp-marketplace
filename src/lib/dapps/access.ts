import type { DApp } from '@/lib/dapps';
import {
  getDAppChainIds,
  getDAppNetworkType,
  isDAppCompatibleWithChain,
  isMultichainDApp,
} from '@/lib/dapps';
import {
  getDAppAvailableChainNames,
  getDAppPrimaryChainName,
} from '@/lib/dapps/contractResolver';
import { getChainById } from '@/lib/wagmi';

export type DAppGateReason =
  | 'open'
  | 'filter_mismatch'
  | 'l1_wallet_required'
  | 'l2_wallet_required'
  | 'l2_chain_mismatch'
  | 'contract_missing';

export function isTestnetDApp(dapp: DApp): boolean {
  const status = (dapp.status || '').toLowerCase();
  return (
    status === 'testnet' ||
    (dapp.network || '').toLowerCase().includes('testnet') ||
    (dapp.network || '').toLowerCase().includes('galleon') ||
    (dapp.name || '').toLowerCase().includes('testnet')
  );
}

export function getDAppNetworkFamilyLabel(dapp: DApp, networkType: 'L1' | 'L2'): string {
  const lower = (dapp.network || '').toLowerCase();
  if (networkType === 'L2') {
    if (lower.includes('igra')) return 'IGRA';
    if (lower.includes('kasplex')) return 'Kasplex';
    return 'L2 EVM';
  }
  if (lower.includes('kaspa')) return 'Kaspa';
  return 'Kaspa';
}

export function getDAppEnvironmentLabel(dapp: DApp): string {
  const status = (dapp.status || '').toLowerCase();
  if (status === 'suspended') return 'Suspended';
  if (status === 'testnet' || isTestnetDApp(dapp)) return 'Testnet';
  if (status === 'mainnet') return 'Mainnet';
  return dapp.status || 'Mainnet';
}

export function getDAppLayerLabel(dapp: DApp): {
  layer: 'L1' | 'L2';
  family: string;
  env: string;
  display: string;
} {
  const layer = getDAppNetworkType(dapp);
  const family = getDAppNetworkFamilyLabel(dapp, layer);
  const env = getDAppEnvironmentLabel(dapp);
  const display =
    layer === 'L1'
      ? `${family} L1${env !== 'Mainnet' ? ` (${env})` : ''}`
      : `${family} L2${env !== 'Mainnet' ? ` (${env})` : ''}`;
  return { layer, family, env, display };
}

export interface DAppAccessInput {
  dapp: DApp;
  selectedNetwork?: 'all' | 'L1' | 'L2' | 'MULTI';
  isKaspaConnected: boolean;
  isEvmConnected: boolean;
  chainId?: number;
  isContractMissingOnNetwork?: boolean;
}

export interface DAppAccessResult {
  isOpenable: boolean;
  reason: DAppGateReason;
  requiredChainNames: string[];
  networkInfo: ReturnType<typeof getDAppLayerLabel>;
}

export function getRequiredChainNames(dapp: DApp): string[] {
  return getDAppAvailableChainNames(dapp);
}

export function getDAppBlockedOverlayMessage(
  reason: DAppGateReason,
  dapp: DApp,
  requiredChainNames: string[]
): string {
  switch (reason) {
    case 'l2_wallet_required':
      return 'Connect your EVM wallet to use this dApp';
    case 'l2_chain_mismatch':
    case 'contract_missing':
      return requiredChainNames.length > 1
        ? 'Switch your wallet to a supported network to use this dApp'
        : requiredChainNames[0]
          ? `Switch your wallet to ${requiredChainNames[0]} to use this dApp`
          : `Switch your wallet to ${getDAppPrimaryChainName(dapp)} to use this dApp`;
    case 'l1_wallet_required':
      return 'Connect your Kaspa wallet to use this dApp';
    case 'filter_mismatch':
      return 'Adjust your network filter to use this dApp';
    default:
      return 'Connect your wallet to use this dApp';
  }
}

export function getDAppGateOverlaySubtitle(reason: DAppGateReason): string {
  switch (reason) {
    case 'l2_chain_mismatch':
    case 'contract_missing':
      return 'Click to change network';
    case 'l2_wallet_required':
    case 'l1_wallet_required':
      return 'Click to connect';
    default:
      return 'Click to continue';
  }
}

export function evaluateDAppAccess(input: DAppAccessInput): DAppAccessResult {
  const {
    dapp,
    selectedNetwork = 'all',
    isKaspaConnected,
    isEvmConnected,
    chainId,
    isContractMissingOnNetwork = false,
  } = input;

  const networkInfo = getDAppLayerLabel(dapp);
  const requiredChainNames = getRequiredChainNames(dapp);
  const networkType = networkInfo.layer;

  if (selectedNetwork === 'MULTI' && !isMultichainDApp(dapp)) {
    return { isOpenable: false, reason: 'filter_mismatch', requiredChainNames, networkInfo };
  }

  if (isMultichainDApp(dapp) && selectedNetwork !== 'all' && selectedNetwork !== 'MULTI') {
    return { isOpenable: false, reason: 'filter_mismatch', requiredChainNames, networkInfo };
  }

  if (dapp.source === 'directory') {
    if (selectedNetwork !== 'all' && selectedNetwork !== 'MULTI' && dapp.networkType && networkType !== selectedNetwork) {
      return { isOpenable: false, reason: 'filter_mismatch', requiredChainNames, networkInfo };
    }
    return { isOpenable: true, reason: 'open', requiredChainNames, networkInfo };
  }

  const isNetworkMismatch =
    selectedNetwork !== 'all' &&
    selectedNetwork !== 'MULTI' &&
    networkType !== selectedNetwork;
  if (isNetworkMismatch) {
    return { isOpenable: false, reason: 'filter_mismatch', requiredChainNames, networkInfo };
  }

  if (isContractMissingOnNetwork) {
    if (networkType === 'L2') {
      return {
        isOpenable: false,
        reason: 'l2_chain_mismatch',
        requiredChainNames: getDAppAvailableChainNames(dapp),
        networkInfo,
      };
    }
    return { isOpenable: false, reason: 'l1_wallet_required', requiredChainNames, networkInfo };
  }

  if (networkType === 'L1') {
    if (!isKaspaConnected) {
      return { isOpenable: false, reason: 'l1_wallet_required', requiredChainNames, networkInfo };
    }
    return { isOpenable: true, reason: 'open', requiredChainNames, networkInfo };
  }

  if (!isEvmConnected) {
    return { isOpenable: false, reason: 'l2_wallet_required', requiredChainNames, networkInfo };
  }

  if (chainId === undefined || !isDAppCompatibleWithChain(dapp, chainId)) {
    return { isOpenable: false, reason: 'l2_chain_mismatch', requiredChainNames, networkInfo };
  }

  return { isOpenable: true, reason: 'open', requiredChainNames, networkInfo };
}

export function getDAppGateMessage(reason: DAppGateReason, requiredChainNames: string[]): string {
  switch (reason) {
    case 'filter_mismatch':
      return 'This dApp is hidden by your current network filter. Switch the filter to match this dApp.';
    case 'l1_wallet_required':
      return 'Connect a Kaspa L1 wallet to open and use this dApp.';
    case 'l2_wallet_required':
      return 'Connect an EVM wallet to open and use this dApp.';
    case 'l2_chain_mismatch':
      return requiredChainNames.length > 0
        ? `Switch your wallet to ${requiredChainNames.join(' or ')} to use this dApp.`
        : 'Switch your wallet to a supported L2 network to use this dApp.';
    case 'contract_missing':
      return requiredChainNames.length > 0
        ? `Switch your wallet to ${requiredChainNames.join(' or ')} to use this dApp.`
        : 'Switch your wallet to a supported network to use this dApp.';
    default:
      return 'A wallet connection is required to use this dApp.';
  }
}
