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
  kastle: {
    id: 'kastle',
    name: 'Kastle',
    downloadUrl: 'https://kastle.cc',
    documentationUrl: 'https://docs.kastle.cc/',
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

  // Check Kastle - check for window.kastle (SDK detection will happen during connection)
  if (win.kastle) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.kastle,
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
export function getWalletProvider(provider: KaspaWalletProvider): KaspaWalletProviderInterface | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const win = getWindow();

  switch (provider) {
    case 'kasware':
      return win.kasware || null;
    case 'kastle':
      return win.kastle || null;
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
 */
export async function connectKaspaWallet(
  provider: KaspaWalletProvider
): Promise<KaspaWalletState> {
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

      case 'kastle': {
        // Kastle uses SDK: @forbole/kastle-sdk
        // Documentation: https://docs.kastle.cc/kastle-wallet-documentation/how-to-integrate/kastle-sdk
        try {
          const sdk = await import('@forbole/kastle-sdk');
          
          // Check if Kastle is installed
          const isInstalled = await sdk.isWalletInstalled();
          if (!isInstalled) {
            throw new Error('Kastle wallet is not installed');
          }
          
          // Connect to Kastle - connect() returns boolean
          const connected = await sdk.connect();
          if (!connected) {
            throw new Error('Failed to connect to Kastle wallet. User may have rejected the connection.');
          }
          
          // After connection, try to get the address
          // The SDK might expose address through window.kastle after connection
          if (win.kastle) {
            const kastle = win.kastle as any;
            // Try getAccounts first (Kastle API pattern)
            if (typeof kastle.getAccounts === 'function') {
              const accounts = await kastle.getAccounts();
              address = Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
            } 
            // Try getSelectedAddress
            else if (typeof kastle.getSelectedAddress === 'function') {
              address = await kastle.getSelectedAddress();
            }
            // Try selectedAddress property
            else if (kastle.selectedAddress) {
              address = kastle.selectedAddress;
            }
          }
          
          // If still no address, try to get public key and derive address
          // (This is a fallback - actual address retrieval may vary)
          if (!address) {
            try {
              // Note: Getting public key doesn't give us the address directly
              // but we'll try window.kastle methods as fallback
              if (win.kastle) {
                const kastle = win.kastle as any;
                // Try any address-related methods
                if (typeof kastle.getAddress === 'function') {
                  address = await kastle.getAddress();
                }
              }
            } catch {
              // Ignore - we'll throw error below if no address found
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Failed to connect to Kastle: ${errorMessage}`);
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

    // Normalize address (ensure kaspa: prefix)
    const normalizedAddress = address.startsWith('kaspa:') 
      ? address 
      : `kaspa:${address}`;

    return {
      isConnected: true,
      address: normalizedAddress,
      provider,
      error: null,
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

    // Normalize address
    return address.startsWith('kaspa:') ? address : `kaspa:${address}`;
  } catch (error) {
    console.error('Error getting address:', error);
    return null;
  }
}

/**
 * Format Kaspa address for display
 */
export function formatKaspaAddress(
  address: string,
  options: { startChars?: number; endChars?: number } = {}
): KaspaAddress {
  const { startChars = 6, endChars = 4 } = options;
  
  // Remove kaspa: prefix for short format
  const short = address.replace(/^kaspa:/i, '');
  
  // Create display format
  const display = short.length > startChars + endChars
    ? `${short.substring(0, startChars)}...${short.substring(short.length - endChars)}`
    : short;

  return {
    full: address.startsWith('kaspa:') ? address : `kaspa:${address}`,
    short,
    display,
  };
}

/**
 * Validate Kaspa address format
 */
export function isValidKaspaAddress(address: string): boolean {
  // Kaspa addresses can be in format: kaspa:... or just the address
  // Typical length: 34-62 characters after prefix
  const kaspaAddressRegex = /^(kaspa:)?[a-z0-9]{34,62}$/i;
  return kaspaAddressRegex.test(address);
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

