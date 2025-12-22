/**
 * Native Kaspa Wallet Connector
 * 
 * Handles detection and connection to native Kaspa wallets
 */

import type {
  KaspaWalletProvider,
  KaspaWalletState,
  KaspaWalletProviderInfo,
  KaspaWalletProviderInterface,
  WindowWithKaspa,
  KaspaAddress,
  KaspaTransactionRequest,
  KaspaTransactionResponse,
} from './types';
import { 
  isValidKaspaAddress as sdkIsValidKaspaAddress,
  normalizeKaspaAddress as sdkNormalizeKaspaAddress,
  formatKaspaAddress as sdkFormatKaspaAddress,
} from './sdk';
import type { SIWKAuthResult } from './auth';

/**
 * List of supported wallet providers with metadata
 */
export const KASPA_WALLET_PROVIDERS: Record<KaspaWalletProvider, Omit<KaspaWalletProviderInfo, 'isInstalled'>> = {
  kasware: {
    id: 'kasware',
    name: 'KasWare',
    downloadUrl: 'https://chrome.google.com/webstore/detail/hklhheigdmpoolooomdihmhlpjjdbklf',
    documentationUrl: 'https://docs.kasware.xyz/wallet/',
  },
  kaspium: {
    id: 'kaspium',
    name: 'Kaspium',
    downloadUrl: 'https://kaspium.app',
    documentationUrl: 'https://docs.kaspium.app',
  },
  okx: {
    id: 'okx',
    name: 'OKX Wallet',
    downloadUrl: 'https://www.okx.com/web3',
    documentationUrl: 'https://www.okx.com/support',
  },
  safepal: {
    id: 'safepal',
    name: 'SafePal',
    downloadUrl: 'https://www.safepal.com',
    documentationUrl: 'https://docs.safepal.com',
  },
  unknown: {
    id: 'unknown',
    name: 'Unknown',
  },
};

/**
 * Get window object with Kaspa wallet types
 */
function getWindow(): WindowWithKaspa {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }
  return window as WindowWithKaspa;
}

/**
 * Detect installed Kaspa wallet providers
 */
export function detectKaspaWallets(): KaspaWalletProviderInfo[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const win = getWindow();
  const providers: KaspaWalletProviderInfo[] = [];

  // Check KasWare - check for window.kasware
  if (win.kasware) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.kasware,
      isInstalled: true,
    });
  }

  // Check Kaspium
  if (win.kaspium) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.kaspium,
      isInstalled: true,
    });
  }

  // Check OKX
  if (win.okx?.kaspa) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.okx,
      isInstalled: true,
    });
  }

  // Check SafePal
  if (win.safepal?.kaspa) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.safepal,
      isInstalled: true,
    });
  }

  return providers;
}

/**
 * Get wallet provider interface by provider ID
 */
/**
 * Extended wallet provider interface with balance support
 */
interface ExtendedWalletProviderInterface extends KaspaWalletProviderInterface {
  getBalance?: () => Promise<string | number | { balance: string | number } | null>;
}

/**
 * Create adapter for KasWare wallet to match SDK interface
 */
function createKasWareAdapter(kasware: any): ExtendedWalletProviderInterface {
  const adapter: ExtendedWalletProviderInterface = {
    isConnected: () => {
      if (typeof kasware.isConnected === 'function') {
        return kasware.isConnected();
      }
      // Fallback: check if we can get address
      return true; // Assume connected if method doesn't exist
    },
    getAddress: async () => {
      if (typeof kasware.getAddress === 'function') {
        return await kasware.getAddress();
      }
      if (typeof kasware.requestAccounts === 'function') {
        const accounts = await kasware.requestAccounts();
        return accounts && accounts.length > 0 ? accounts[0] : null;
      }
      return null;
    },
    requestConnection: async () => {
      if (typeof kasware.requestAccounts === 'function') {
        const accounts = await kasware.requestAccounts();
        if (accounts && accounts.length > 0) {
          return accounts[0];
        }
      }
      throw new Error('Failed to request connection');
    },
    disconnect: async () => {
      if (typeof kasware.disconnect === 'function') {
        await kasware.disconnect();
      }
    },
    signMessage: async (message: string) => {
      if (typeof kasware.signMessage === 'function') {
        return await kasware.signMessage(message);
      }
      throw new Error('signMessage not available');
    },
    sendTransaction: async (transaction: any) => {
      // KasWare uses sendKaspa(toAddress, sompi, options)
      if (typeof kasware.sendKaspa === 'function') {
        const toAddress = transaction.to;
        const sompi = typeof transaction.amount === 'string' ? parseInt(transaction.amount) : transaction.amount;
        const options: Record<string, any> = {};
        
        if (transaction.fee) {
          options.priorityFee = typeof transaction.fee === 'string' ? parseFloat(transaction.fee) : transaction.fee;
        }
        
        return await kasware.sendKaspa(toAddress, sompi, options);
      }
      throw new Error('sendKaspa not available');
    },
    on: (event: 'accountsChanged', callback: (accounts: string[]) => void) => {
      if (typeof kasware.on === 'function') {
        kasware.on(event, callback);
      }
    },
    removeListener: (event: 'accountsChanged', callback: (accounts: string[]) => void) => {
      if (typeof kasware.removeListener === 'function') {
        kasware.removeListener(event, callback);
      }
    },
  };

  // Add getBalance if available
  if (typeof kasware.getBalance === 'function') {
    adapter.getBalance = async () => {
      return await kasware.getBalance();
    };
  }

  return adapter;
}

export function getWalletProvider(provider: KaspaWalletProvider): ExtendedWalletProviderInterface | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const win = getWindow();

  switch (provider) {
    case 'kasware': {
      const kasware = win.kasware;
      if (!kasware) return null;
      // Create adapter for KasWare to match SDK interface
      return createKasWareAdapter(kasware);
    }
    case 'kaspium':
      return win.kaspium || null;
    case 'okx':
      return win.okx?.kaspa || null;
    case 'safepal':
      return win.safepal?.kaspa || null;
    default:
      return null;
  }
}

export function getWalletProvider(provider: KaspaWalletProvider): KaspaWalletProviderInterface | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const win = getWindow();

  switch (provider) {
    case 'kasware': {
      const kasware = win.kasware;
      if (!kasware) return null;
      // Create adapter for KasWare to match SDK interface
      return createKasWareAdapter(kasware);
    }
    case 'kaspium':
      return win.kaspium || null;
    case 'okx':
      return win.okx?.kaspa || null;
    case 'safepal':
      return win.safepal?.kaspa || null;
    default:
      return null;
  }
}

/**
 * Connect to a Kaspa wallet
 * 
 * @param provider - Wallet provider to connect to
 * @param options - Connection options
 * @param options.enableSIWK - Enable Sign-In with Kaspa authentication (default: false)
 * @param options.siwkParams - Optional SIWK parameters if enableSIWK is true
 * @returns Wallet connection state
 */
export async function connectKaspaWallet(
  provider: KaspaWalletProvider,
  options?: {
    enableSIWK?: boolean;
    siwkParams?: {
      domain?: string;
      statement?: string;
      appName?: string;
    };
  }
): Promise<KaspaWalletState & { siwkAuth?: SIWKAuthResult }> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Window is not available');
    }

    const win = getWindow();
    let address: string | null = null;

    // Handle different wallet providers with their specific APIs
    switch (provider) {
      case 'kasware': {
        if (!win.kasware) {
          throw new Error('KasWare wallet is not installed');
        }
        
        // KasWare API: requestAccounts() returns Promise<string[]>
        // Documentation: https://docs.kasware.xyz/wallet/dev-base/kaspa
        const kasware = win.kasware as any;
        
        if (typeof kasware.requestAccounts === 'function') {
          const accounts = await kasware.requestAccounts();
          if (Array.isArray(accounts) && accounts.length > 0) {
            address = accounts[0];
          } else {
            throw new Error('No accounts returned from KasWare wallet');
          }
        } else {
          throw new Error('KasWare wallet API not available. Please update your KasWare extension.');
        }
        break;
      }

      case 'kaspium': {
        if (!win.kaspium) {
          throw new Error('Kaspium wallet is not installed');
        }
        const kaspium = win.kaspium as any;
        if (typeof kaspium.request === 'function') {
          const result = await kaspium.request({ method: 'kaspa_requestAccounts' });
          address = Array.isArray(result) ? result[0] : result?.address || result?.accounts?.[0];
        } else if (typeof kaspium.getAddress === 'function') {
          address = await kaspium.getAddress();
        }
        break;
      }

      case 'okx': {
        if (!win.okx?.kaspa) {
          throw new Error('OKX Kaspa wallet is not installed');
        }
        const okxKaspa = win.okx.kaspa as any;
        if (typeof okxKaspa.request === 'function') {
          const result = await okxKaspa.request({ method: 'kaspa_requestAccounts' });
          address = Array.isArray(result) ? result[0] : result?.address || result?.accounts?.[0];
        }
        break;
      }

      case 'safepal': {
        if (!win.safepal?.kaspa) {
          throw new Error('SafePal Kaspa wallet is not installed');
        }
        const safepalKaspa = win.safepal.kaspa as any;
        if (typeof safepalKaspa.request === 'function') {
          const result = await safepalKaspa.request({ method: 'kaspa_requestAccounts' });
          address = Array.isArray(result) ? result[0] : result?.address || result?.accounts?.[0];
        }
        break;
      }

      default:
        throw new Error(`Unsupported wallet provider: ${provider}`);
    }

    if (!address) {
      throw new Error('Failed to get address from wallet. Please ensure the wallet is unlocked and try again.');
    }

    // Validate address using SDK
    if (!sdkIsValidKaspaAddress(address)) {
      throw new Error('Invalid Kaspa address returned from wallet');
    }

    // Normalize address using SDK (ensure kaspa: prefix)
    const normalizedAddress = sdkNormalizeKaspaAddress(address);

    // SIWK authentication (enabled by default)
    let siwkAuth: SIWKAuthResult | undefined;
    if (options?.enableSIWK !== false) { // Default to true unless explicitly disabled
      try {
        const { signInWithKaspa } = await import('./auth');
        const domain = options?.siwkParams?.domain || (typeof window !== 'undefined' ? window.location.hostname : 'kasparex.com');
        const appName = options?.siwkParams?.appName || 'Kasparex dApps';
        
        siwkAuth = await signInWithKaspa(provider, {
          domain,
          address: normalizedAddress,
          statement: options?.siwkParams?.statement || `Welcome to ${appName}!`,
        });
      } catch (siwkError) {
        // If SIWK fails, we can either:
        // 1. Fail the connection (strict mode)
        // 2. Continue without SIWK (permissive mode - current behavior)
        // Using permissive mode to not break existing flows
        console.warn('SIWK authentication failed, continuing with connection:', siwkError);
        // Don't fail the connection if SIWK fails, just log a warning
      }
    }

    return {
      isConnected: true,
      address: normalizedAddress,
      provider,
      error: null,
      ...(siwkAuth && { siwkAuth }),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      isConnected: false,
      address: null,
      provider: null,
      error: errorMessage,
    };
  }
}

/**
 * Disconnect from a Kaspa wallet
 */
export async function disconnectKaspaWallet(
  provider: KaspaWalletProvider
): Promise<void> {
  try {
    const walletProvider = getWalletProvider(provider);
    
    if (walletProvider && walletProvider.isConnected()) {
      await walletProvider.disconnect();
    }
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
}

/**
 * Get current connected address
 */
export async function getKaspaAddress(
  provider: KaspaWalletProvider
): Promise<string | null> {
  try {
    const walletProvider = getWalletProvider(provider);
    
    if (!walletProvider || !walletProvider.isConnected()) {
      return null;
    }

    const address = await walletProvider.getAddress();
    
    if (!address) {
      return null;
    }

    // Validate and normalize address using SDK
    if (!sdkIsValidKaspaAddress(address)) {
      console.error('Invalid address returned from wallet');
      return null;
    }

    return sdkNormalizeKaspaAddress(address);
  } catch (error) {
    console.error('Error getting address:', error);
    return null;
  }
}

/**
 * Format Kaspa address for display
 * Uses SDK utilities for consistent formatting
 */
export function formatKaspaAddress(
  address: string,
  options: { startChars?: number; endChars?: number } = {}
): KaspaAddress {
  // Use SDK formatting
  const formatted = sdkFormatKaspaAddress(address, options);
  
  return {
    full: formatted.full,
    short: formatted.short,
    display: formatted.display,
  };
}

/**
 * Validate Kaspa address format
 * Uses SDK validation for standardized checking
 * 
 * @deprecated Use isValidKaspaAddress from './sdk' directly for new code
 */
export function isValidKaspaAddress(address: string): boolean {
  return sdkIsValidKaspaAddress(address);
}

/**
 * Sign a message with Kaspa wallet
 */
export async function signKaspaMessage(
  provider: KaspaWalletProvider,
  message: string
): Promise<string> {
  const walletProvider = getWalletProvider(provider);
  
  if (!walletProvider || !walletProvider.isConnected()) {
    throw new Error('Wallet is not connected');
  }

  try {
    return await walletProvider.signMessage(message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to sign message: ${errorMessage}`);
  }
}

/**
 * Send a transaction via Kaspa wallet
 */
export async function sendKaspaTransaction(
  provider: KaspaWalletProvider,
  transaction: KaspaTransactionRequest
): Promise<KaspaTransactionResponse> {
  const walletProvider = getWalletProvider(provider);
  
  if (!walletProvider || !walletProvider.isConnected()) {
    throw new Error('Wallet is not connected');
  }

  try {
    const txHash = await walletProvider.sendTransaction(transaction);
    return {
      txHash,
      status: 'pending',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      txHash: '',
      status: 'failed',
      error: errorMessage,
    };
  }
}

/**
 * Set up account change listener
 */
export function onKaspaAccountChange(
  provider: KaspaWalletProvider,
  callback: (accounts: string[]) => void
): () => void {
  const walletProvider = getWalletProvider(provider);
  
  if (!walletProvider) {
    return () => {}; // No-op cleanup
  }

  walletProvider.on('accountsChanged', callback);

  // Return cleanup function
  return () => {
    walletProvider.removeListener('accountsChanged', callback);
  };
}

