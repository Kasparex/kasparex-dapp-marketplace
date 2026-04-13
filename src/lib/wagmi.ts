'use client';

import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, createStorage, http } from 'wagmi';
import { defineChain, type Chain } from 'viem';
import { createKastleMipdBlockConnectors } from '@/lib/evm/kastleMipdBlock';
import { deleteSharedCookie, getSharedCookie, setSharedCookie } from '@/lib/storage/sharedCookie';

/**
 * Kasplex L2 Mainnet Chain Configuration
 * 
 * Custom chain definition for Kasplex Layer 2 Mainnet network
 */
export const kasplexL2Mainnet = defineChain({
  id: 202555,
  name: 'Kasplex Mainnet',
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
  name: 'Kasplex Testnet',
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
 * Igra Testnet (38836)
 * Active Igra testnet; use tKREX ERC-20 when configured.
 * @see https://igra-labs.gitbook.io/igralabs-docs/quickstart/network-info#galleon-testnet
 */
export const igraGalleonTestnet = defineChain({
  id: 38836,
  name: 'Igra Testnet',
  network: 'igra-galleon-testnet',
  nativeCurrency: {
    name: 'Kaspa',
    symbol: 'iKAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://galleon-testnet.igralabs.com:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Igra Testnet Explorer',
      url: 'https://explorer.galleon-testnet.igralabs.com',
    },
  },
  testnet: true,
});

/**
 * Igra Mainnet (Chain ID 38833, 0x97B1)
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
  IGRA_GALLEON_TESTNET: 38836,
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
  igraGalleonTestnet,
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
 * Get the native currency symbol for a chain (e.g. KAS, iKAS on Igra Mainnet).
 * Use this everywhere we display payment/balance amounts so the UI matches the chain.
 */
export function getNativeCurrencySymbol(chainId: number): string {
  return getChainById(chainId)?.nativeCurrency?.symbol ?? 'KAS';
}

/**
 * Wagmi Configuration
 * 
 * Configured with Kaspa EVM-compatible chains
 * Uses WalletConnect for wallet connections
 */
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Warn if WalletConnect project ID is not configured
if (typeof window !== 'undefined' && (!walletConnectProjectId || walletConnectProjectId === 'default-project-id')) {
  console.warn(
    '⚠️ WalletConnect project ID not configured. ' +
    'Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID environment variable. ' +
    'Wallet connections may fail. Get a project ID at https://cloud.walletconnect.com'
  );
}

const wagmiChains = [
  kasplexL2Mainnet,
  kasplexL2Testnet,
  igraGalleonTestnet,
  igraMainnet,
] as const;

const { connectors: rainbowKitConnectors } = getDefaultWallets({
  appName: 'Kasparex dApps',
  projectId: walletConnectProjectId || 'default-project-id',
});

export const config = createConfig({
  chains: wagmiChains,
  connectors: [...createKastleMipdBlockConnectors(), ...rainbowKitConnectors],
  transports: {
    [kasplexL2Mainnet.id]: http(),
    [kasplexL2Testnet.id]: http(),
    [igraGalleonTestnet.id]: http(),
    [igraMainnet.id]: http(),
  },
  // Persist across kasparex.com subdomains (hub/store/vblog/ads/etc).
  // Default wagmi storage is localStorage (host-only), which drops sessions on subdomain navigation.
  storage: createStorage({
    storage: {
      getItem: (key) => getSharedCookie(key),
      setItem: (key, value) => setSharedCookie(key, value, { maxAgeSeconds: 60 * 60 * 24 * 30 }), // 30 days
      removeItem: (key) => deleteSharedCookie(key),
    },
  }),
  ssr: true,
});

