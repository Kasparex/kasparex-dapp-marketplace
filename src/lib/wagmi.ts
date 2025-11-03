'use client';

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
      url: 'https://frontend.kasplextest.xyz',
    },
  },
  testnet: true,
});

/**
 * Igra Caravel Testnet Chain Configuration
 * 
 * Custom chain definition for Igra Caravel Testnet network
 */
export const igraCaravelTestnet = defineChain({
  id: 19416,
  name: 'Igra Caravel Testnet',
  network: 'igra-caravel-testnet',
  nativeCurrency: {
    name: 'Kaspa',
    symbol: 'KAS',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://caravel.igralabs.com:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Igra Caravel Explorer',
      url: 'https://explorer.caravel.igralabs.com',
    },
  },
  testnet: true,
});

/**
 * KRC-20 Network Information
 * 
 * Note: KRC-20 is NOT EVM-compatible and cannot be used with RainbowKit/Wagmi.
 * This is a reference constant for display/filtering purposes only.
 * KRC-20 requires Kaspa-native wallets (not EVM wallets like MetaMask).
 */
export const KRC20_NETWORK_INFO = {
  name: 'KRC-20 L1 Mainnet',
  displayName: 'KRC-20',
  chainId: null, // Not EVM-compatible
  isEVMCompatible: false,
  requiresNativeWallet: true,
  documentation: 'https://docs.kasplex.org/',
  indexer: 'https://kas.fyi/krc20-tokens',
} as const;

/**
 * Network Chain IDs Mapping
 */
export const CHAIN_IDS = {
  KASPLEX_L2_MAINNET: 202555,
  KASPLEX_L2_TESTNET: 167012,
  IGRA_CARAVEL_TESTNET: 19416,
  // Igra L2 Mainnet - not available yet
} as const;

/**
 * All available EVM-compatible chains for RainbowKit
 */
export const kaspaChains: Chain[] = [
  kasplexL2Mainnet,
  kasplexL2Testnet,
  igraCaravelTestnet,
];

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
export const config = getDefaultConfig({
  appName: 'Kasparex dApps',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  chains: kaspaChains,
  ssr: true, // Enable SSR support for Next.js
});

