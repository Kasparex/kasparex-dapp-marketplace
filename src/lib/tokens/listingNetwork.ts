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
  { id: 'krc20', label: 'L1 Kaspa Mainnet (KRC-20)' },
  {
    id: 'kcc20',
    label: 'L1 Programmable (KCC-20)',
    hint: 'Connect a covenant deployed on testnet-10 (mainnet when ready)',
  },
  { id: 'l2_kasplex', label: 'L2 (Kasplex / EVM)' },
  { id: 'l2_igra', label: 'L2 (Igra / EVM)' },
];

/** True for Kaspa L1 networks that use kaspa: addresses (KRC-20, KCC-20). */
export function isKaspaL1Network(network: TokenListingNetwork): boolean {
  return network === 'krc20' || network === 'kaspa_l1' || network === 'kcc20';
}

/** True for EVM L2 networks that use 0x addresses (Kasplex, Igra). */
export function isL2EvmNetwork(network: TokenListingNetwork): boolean {
  return network === 'l2_kasplex' || network === 'l2_igra';
}

export function listingNetworkToTokenNetwork(network: TokenListingNetwork): TokenNetwork {
  if (network === 'kaspa_l1' || network === 'krc20' || network === 'kcc20') return 'L1';
  return 'L2';
}

export function isProgrammableListingNetwork(network: TokenListingNetwork): boolean {
  return network === 'kcc20';
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
  if (id === 'kaspa_l1') return 'L1 Kaspa Mainnet';
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
      return {
        network,
        title: 'Verify KCC-20 controller',
        intro:
          'Confirm you control the Kaspa wallet that deployed or governs this programmable token covenant. Sign a verification message with the controller wallet.',
        walletKind: 'kaspa',
        methods: [
          {
            id: 'covenant_controller_signature',
            label: 'Controller wallet signature',
            description:
              'Sign with the Kaspa wallet linked to this covenant. Include your covenant id in the verification record.',
            walletKind: 'kaspa',
            available: true,
          },
        ],
      };
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
