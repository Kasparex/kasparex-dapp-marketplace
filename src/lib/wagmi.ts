'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

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
 * Wagmi Configuration
 * 
 * Configured with Kasplex L2 Mainnet as the primary chain
 * Uses WalletConnect for wallet connections
 */
export const config = getDefaultConfig({
  appName: 'Kasparex dApps',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  chains: [kasplexL2Mainnet],
  ssr: true, // Enable SSR support for Next.js
});

