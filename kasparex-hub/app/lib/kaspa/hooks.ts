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
 * Hook for Kaspa network
 */
export function useKaspaNetwork() {
  const { walletType, isConnected } = useKaspaWalletContext();
  // In the future, this could return network info from the wallet
  return { network: walletType, isConnected };
}

