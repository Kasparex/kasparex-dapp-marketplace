import type { TokenNetwork } from './types';

export type TokenListingNetwork =
  | 'kaspa_l1'
  | 'krc20'
  | 'l2_kasplex'
  | 'l2_igra'
  | 'kcc20';

export type TokenListingNetworkOption = {
  id: TokenListingNetwork;
  label: string;
  disabled?: boolean;
  hint?: string;
};

export const TOKEN_LISTING_NETWORK_OPTIONS: TokenListingNetworkOption[] = [
  { id: 'kaspa_l1', label: 'Kaspa L1' },
  { id: 'krc20', label: 'KRC-20' },
  { id: 'l2_kasplex', label: 'L2 (Kasplex / EVM)' },
  { id: 'l2_igra', label: 'L2 (Igra / EVM)' },
  { id: 'kcc20', label: 'KCC20 (coming soon)', disabled: true, hint: 'Coming soon' },
];

export function listingNetworkToTokenNetwork(network: TokenListingNetwork): TokenNetwork {
  if (network === 'kaspa_l1' || network === 'krc20') return 'L1';
  return 'L2';
}

export function tokenNetworkToListingNetwork(
  network: TokenNetwork,
  contractAddress?: string,
): TokenListingNetwork {
  if (network === 'L1') {
    return contractAddress?.startsWith('0x') ? 'krc20' : 'kaspa_l1';
  }
  return 'l2_kasplex';
}

export function getListingNetworkLabel(id: TokenListingNetwork): string {
  return TOKEN_LISTING_NETWORK_OPTIONS.find((o) => o.id === id)?.label ?? id;
}
