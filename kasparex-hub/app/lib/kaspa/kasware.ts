/**
 * Kasware Wallet Integration
 *
 * Fresh implementation for connecting to Kasware wallet extension
 * Documentation: https://docs.kasware.xyz/
 */

import { kaswareBalanceToKas } from "./balance";

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
  on(event: string, callback: (...args: unknown[]) => void): void;
  removeListener(event: string, callback: (...args: unknown[]) => void): void;
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

/** Balance in KAS (not sompi), normalized from wallet payload. */
export async function getKaswareBalanceKas(): Promise<number | null> {
  const provider = getKaswareProvider();
  if (!provider) return null;

  try {
    const raw = await provider.getBalance();
    return kaswareBalanceToKas(raw);
  } catch (error) {
    console.error("Error getting Kasware balance:", error);
    return null;
  }
}

export async function getKaswareNetwork(): Promise<string | null> {
  const provider = getKaswareProvider();
  if (!provider || typeof provider.getNetwork !== "function") return null;
  try {
    return await provider.getNetwork();
  } catch (error) {
    console.error("Error getting Kasware network:", error);
    return null;
  }
}

export async function getKaswareKrc20Balances(): Promise<
  Array<{ tick: string; amount: string | number; [key: string]: unknown }>
> {
  const provider = getKaswareProvider();
  if (!provider || typeof provider.getKRC20Balance !== "function") {
    return [];
  }
  try {
    const list = await provider.getKRC20Balance();
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("Error getting Kasware KRC-20 balances:", error);
    return [];
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



