/**
 * Kastle Wallet Integration
 * 
 * Fresh implementation for connecting to Kastle wallet extension
 */

export interface KastleProvider {
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
 * Get Kastle provider from window
 */
export function getKastleProvider(): KastleProvider | null {
  if (typeof window === 'undefined') return null;
  
  // Check for Kastle extension
  const kastle = (window as any).kastle;
  if (!kastle) return null;
  
  return kastle as KastleProvider;
}

/**
 * Check if Kastle is installed
 */
export function isKastleInstalled(): boolean {
  return getKastleProvider() !== null;
}

/**
 * Connect to Kastle wallet
 */
export async function connectKastle(): Promise<string | null> {
  const provider = getKastleProvider();
  if (!provider) {
    throw new Error('Kastle wallet not found. Please install Kastle extension.');
  }

  try {
    const accounts = await provider.requestAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error connecting to Kastle:', error);
    throw error;
  }
}

/**
 * Get current address from Kastle
 */
export async function getKastleAddress(): Promise<string | null> {
  const provider = getKastleProvider();
  if (!provider) return null;

  try {
    return await provider.getAddress();
  } catch (error) {
    console.error('Error getting Kastle address:', error);
    return null;
  }
}

/**
 * Get balance from Kastle
 */
export async function getKastleBalance(): Promise<string | number | null> {
  const provider = getKastleProvider();
  if (!provider) return null;

  try {
    const balance = await provider.getBalance();
    if (typeof balance === 'object' && balance !== null && 'balance' in balance) {
      return balance.balance;
    }
    return balance;
  } catch (error) {
    console.error('Error getting Kastle balance:', error);
    return null;
  }
}

/**
 * Disconnect from Kastle
 */
export async function disconnectKastle(): Promise<void> {
  const provider = getKastleProvider();
  if (!provider) return;

  try {
    await provider.disconnect();
  } catch (error) {
    console.error('Error disconnecting from Kastle:', error);
  }
}



