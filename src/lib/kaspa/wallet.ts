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
    downloadUrl: 'https://kasware.io',
    documentationUrl: 'https://docs.kasware.io',
  },
  kastle: {
    id: 'kastle',
    name: 'Kastle',
    downloadUrl: 'https://kastle.app',
    documentationUrl: 'https://docs.kastle.app',
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

  // Check KasWare
  if (win.kasware) {
    providers.push({
      ...KASPA_WALLET_PROVIDERS.kasware,
      isInstalled: true,
    });
  }

  // Check Kastle
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
    const walletProvider = getWalletProvider(provider);
    
    if (!walletProvider) {
      throw new Error(`${provider} wallet is not installed`);
    }

    // Request connection
    const address = await walletProvider.requestConnection();
    
    if (!address) {
      throw new Error('Failed to get address from wallet');
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

