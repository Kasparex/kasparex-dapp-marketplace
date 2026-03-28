import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain, type Chain } from 'viem';

/**
 * Kasplex L2 Mainnet Chain Configuration
 * 
 * Custom chain definition for Kasplex Layer 2 Mainnet network
 */
export const kasplexL2Mainnet = defineChain({
  id: 202555,
  name: 'Kasplex L2 Mainnet',
  network: 'kasplex',
  nativeCurrency: {
    name: 'Kaspa',
    symbol: 'KAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://evmrpc.kasplex.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Kasplex Explorer',
      url: 'https://explorer.kasplex.org',
    },
  },
});

/**
 * Kasplex L2 Testnet Chain Configuration
 * 
 * Custom chain definition for Kasplex Layer 2 Testnet network
 */
export const kasplexL2Testnet = defineChain({
  id: 167012,
  name: 'Kasplex L2 Testnet',
  network: 'kasplex-testnet',
  nativeCurrency: {
    name: 'Kaspa',
    symbol: 'KAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.kasplextest.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Kasplex Testnet Explorer',
      url: 'https://explorer.testnet.kasplextest.xyz',
    },
  },
  testnet: true,
});

/**
 * Igra Mainnet (Chain ID 38833)
 * @see https://igra-labs.gitbook.io/igralabs-docs/quickstart/network-info#igra-mainnet
 */
export const igraMainnet = defineChain({
  id: 38833,
  name: 'Igra Mainnet',
  network: 'igra-mainnet',
  nativeCurrency: {
    name: 'iKAS',
    symbol: 'iKAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.igralabs.com:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Igra Explorer',
      url: 'https://explorer.igralabs.com',
    },
  },
});

/**
 * vProgs Network Chain Configuration (Placeholder)
 * Will be updated when vProgs launches
 */
export const vProgsTestnet = defineChain({
  id: 999999,
  name: 'Kaspa vProgs Testnet',
  network: 'kaspa-vprogs-testnet',
  nativeCurrency: {
    name: 'Kaspa',
    symbol: 'KAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://vprogs-testnet.kaspa.org'], // Placeholder
    },
  },
  blockExplorers: {
    default: {
      name: 'vProgs Explorer',
      url: 'https://explorer.vprogs.kaspa.org', // Placeholder
    },
  },
  testnet: true,
});

export const vProgsMainnet = defineChain({
  id: 999998,
  name: 'Kaspa vProgs Mainnet',
  network: 'kaspa-vprogs',
  nativeCurrency: {
    name: 'Kaspa',
    symbol: 'KAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://vprogs.kaspa.org'], // Placeholder
    },
  },
  blockExplorers: {
    default: {
      name: 'vProgs Explorer',
      url: 'https://explorer.vprogs.kaspa.org', // Placeholder
    },
  },
  testnet: false,
});

/**
 * Network Chain IDs Mapping
 */
export const CHAIN_IDS = {
  KASPLEX_L2_MAINNET: 202555,
  KASPLEX_L2_TESTNET: 167012,
  IGRA_MAINNET: 38833,
  VPROGS_TESTNET: 999999,
  VPROGS_MAINNET: 999998,
} as const;

/**
 * All available EVM-compatible chains for RainbowKit
 */
export const kaspaChains = [
  kasplexL2Mainnet,
  kasplexL2Testnet,
  igraMainnet,
] as const;

/**
 * vProgs chains (for future use)
 */
export const vProgsChains = [
  vProgsTestnet,
  vProgsMainnet,
] as const;

/**
 * All available chains (EVM + vProgs)
 */
export const allChains = [
  ...kaspaChains,
  ...vProgsChains,
] as const;

/**
 * Helper to check if a chain ID is supported
 */
export function isChainSupported(chainId: number): boolean {
  return kaspaChains.some((chain) => chain.id === chainId);
}

/**
 * Helper to get chain by ID
 */
export function getChainById(chainId: number): Chain | undefined {
  return kaspaChains.find((chain) => chain.id === chainId);
}

/**
 * Wagmi Configuration
 * 
 * Configured with Kaspa EVM-compatible chains
 * Uses WalletConnect for wallet connections
 */
// Extend Window interface for ENV
declare global {
  interface Window {
    ENV?: {
      WALLETCONNECT_PROJECT_ID?: string;
    };
  }
}

export const config = getDefaultConfig({
  appName: 'Kasparex Hub',
  projectId: typeof window !== 'undefined' 
    ? (window.ENV?.WALLETCONNECT_PROJECT_ID || process.env.WALLETCONNECT_PROJECT_ID || 'default-project-id')
    : (process.env.WALLETCONNECT_PROJECT_ID || 'default-project-id'),
  chains: [kasplexL2Mainnet, kasplexL2Testnet, igraMainnet],
  ssr: true,
});



