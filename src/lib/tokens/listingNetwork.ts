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

/** Which wallet family proves ownership for a given listing network. */
export type TokenVerificationWalletKind = 'kaspa' | 'evm';

export type TokenVerificationMethod = {
  id: string;
  label: string;
  description: string;
  walletKind: TokenVerificationWalletKind;
  available: boolean;
};

export type TokenVerificationFlow = {
  network: TokenListingNetwork;
  title: string;
  intro: string;
  walletKind: TokenVerificationWalletKind;
  methods: TokenVerificationMethod[];
};

export function getTokenVerificationFlow(network: TokenListingNetwork): TokenVerificationFlow {
  switch (network) {
    case 'krc20':
      return {
        network,
        title: 'Verify KRC-20 ownership',
        intro:
          'Confirm you control the KRC-20 deployer wallet. Sign a verification message with the same Kaspa wallet that deployed the token.',
        walletKind: 'kaspa',
        methods: [
          {
            id: 'deployer_signature',
            label: 'Deployer wallet signature',
            description: 'Sign a message with the Kaspa wallet that deployed this KRC-20 ticker.',
            walletKind: 'kaspa',
            available: true,
          },
        ],
      };
    case 'kaspa_l1':
      return {
        network,
        title: 'Verify Kaspa L1 ownership',
        intro: 'Sign a verification message with your Kaspa L1 wallet to confirm this listing.',
        walletKind: 'kaspa',
        methods: [
          {
            id: 'kaspa_signature',
            label: 'Kaspa wallet signature',
            description: 'Sign a message with the connected Kaspa wallet.',
            walletKind: 'kaspa',
            available: true,
          },
        ],
      };
    case 'l2_kasplex':
    case 'l2_igra':
      return {
        network,
        title: network === 'l2_igra' ? 'Verify L2 (Igra) ownership' : 'Verify L2 (Kasplex) ownership',
        intro:
          'Confirm you control the contract deployer or owner wallet. Sign a verification message with the EVM wallet that deployed or owns the contract.',
        walletKind: 'evm',
        methods: [
          {
            id: 'evm_owner_signature',
            label: 'Owner / deployer signature',
            description: 'Sign a message with the EVM wallet that deployed or owns the contract.',
            walletKind: 'evm',
            available: true,
          },
          {
            id: 'evm_owner_onchain',
            label: 'On-chain owner() match',
            description: 'Auto-check the contract owner() against your connected EVM wallet.',
            walletKind: 'evm',
            available: false,
          },
        ],
      };
    case 'kcc20':
    default:
      return {
        network,
        title: 'Verification coming soon',
        intro: 'Verification for this network is not available yet.',
        walletKind: 'kaspa',
        methods: [],
      };
  }
}
