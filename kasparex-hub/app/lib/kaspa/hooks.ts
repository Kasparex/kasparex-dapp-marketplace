/**
 * Kaspa Wallet Hooks
 * 
 * React hooks for interacting with Kaspa wallets
 */

import { useKaspaWallet as useKaspaWalletContext } from "./provider";

/**
 * Hook for Kaspa balance
 */
export function useKaspaBalance() {
  const { balance, isConnected } = useKaspaWalletContext();
  return { balance, isConnected };
}

/**
 * Hook for Kaspa network (mainnet / testnet from wallet)
 */
export function useKaspaNetwork() {
  const { network, isConnected } = useKaspaWalletContext();
  return { network, isConnected };
}

