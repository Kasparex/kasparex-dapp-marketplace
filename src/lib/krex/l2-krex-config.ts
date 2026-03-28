/**
 * L2 KREX token config per chain.
 * Kasplex L2 Mainnet: KREX. IGRA Galleon Testnet (38836): tKREX via env. Igra Mainnet (38833): KREX via env.
 * Other chains: no KREX token (return null).
 */

import type { Address } from 'viem';

const KREX_KASPLEX_MAINNET = '0x0FD8d408cE707f4E4f8E54193c4C55a3b969834B' as Address;

export interface L2KREXConfig {
  tokenAddress: Address;
  rpcUrl: string;
  chainId: number;
}

/**
 * Get L2 KREX token config for the given chain.
 * Returns null when the chain has no KREX/tKREX token (e.g. testnets without deployment).
 */
export function getL2KREXConfig(chainId: number): L2KREXConfig | null {
  if (chainId === 202555) {
    return {
      tokenAddress: KREX_KASPLEX_MAINNET,
      rpcUrl: 'https://evmrpc.kasplex.org',
      chainId: 202555,
    };
  }
  if (chainId === 38836) {
    const tKREX = (process.env.NEXT_PUBLIC_TKREX_ADDRESS_38836 || '').trim();
    if (!tKREX) return null;
    return {
      tokenAddress: tKREX as Address,
      rpcUrl: 'https://galleon-testnet.igralabs.com:8545',
      chainId: 38836,
    };
  }
  if (chainId === 38833) {
    const krex =
      (process.env.NEXT_PUBLIC_KREX_ADDRESS_IGRA_MAINNET || process.env.NEXT_PUBLIC_TKREX_ADDRESS_38833 || '')
        .trim();
    if (!krex) return null;
    return {
      tokenAddress: krex as Address,
      rpcUrl: 'https://rpc.igralabs.com:8545',
      chainId: 38833,
    };
  }
  return null;
}
