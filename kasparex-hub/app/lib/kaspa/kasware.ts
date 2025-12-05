/**
 * Kasware Wallet Integration
 * 
 * Fresh implementation for connecting to Kasware wallet extension
 * Documentation: https://docs.kasware.xyz/
 */

export interface KaswareProvider {
  requestAccounts(): Promise<string[]>;
  getAddress(): Promise<string | null>;
  getBalance(): Promise<string | number | { balance: string | number } | null>;
  isConnected(): boolean;
  disconnect(): Promise<void>;
  signMessage(msg: string, type?: string): Promise<string>;
  sendKaspa(toAddress: string, sompi: number | string, options?: Record<string, any>): Promise<string>;
  getKRC20Balance(): Promise<Array<{ tick: string; amount: string | number; [key: string]: any }>>;
  getNetwork(): Promise<string>;
  getVersion(): Promise<string>;
  on(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
  removeListener(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
}

/**
 * Get Kasware provider from window
 */
export function getKaswareProvider(): KaswareProvider | null {
  if (typeof window === 'undefined') return null;
  
  // Check for Kasware extension
  const kasware = (window as any).kasware;
  if (!kasware) return null;
  
  return kasware as KaswareProvider;
}

/**
 * Check if Kasware is installed
 */
export function isKaswareInstalled(): boolean {
  return getKaswareProvider() !== null;
}

/**
 * Connect to Kasware wallet
 */
export async function connectKasware(): Promise<string | null> {
  const provider = getKaswareProvider();
  if (!provider) {
    throw new Error('Kasware wallet not found. Please install Kasware extension.');
  }

  try {
    const accounts = await provider.requestAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error connecting to Kasware:', error);
    throw error;
  }
}

/**
 * Get current address from Kasware
 */
export async function getKaswareAddress(): Promise<string | null> {
  const provider = getKaswareProvider();
  if (!provider) return null;

  try {
    return await provider.getAddress();
  } catch (error) {
    console.error('Error getting Kasware address:', error);
    return null;
  }
}

/**
 * Get balance from Kasware
 */
export async function getKaswareBalance(): Promise<string | number | null> {
  const provider = getKaswareProvider();
  if (!provider) return null;

  try {
    const balance = await provider.getBalance();
    if (typeof balance === 'object' && balance !== null && 'balance' in balance) {
      return balance.balance;
    }
    return balance;
  } catch (error) {
    console.error('Error getting Kasware balance:', error);
    return null;
  }
}

/**
 * Disconnect from Kasware
 */
export async function disconnectKasware(): Promise<void> {
  const provider = getKaswareProvider();
  if (!provider) return;

  try {
    await provider.disconnect();
  } catch (error) {
    console.error('Error disconnecting from Kasware:', error);
  }
}



