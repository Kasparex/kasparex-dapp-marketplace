/**
 * Native Kaspa Wallet Type Definitions
 * 
 * Types for native Kaspa wallet connections (KasWare, etc.)
 */

/**
 * Supported Kaspa wallet providers
 */
export type KaspaWalletProvider = 
  | 'kasware'
  | 'kastle'
  | 'kaspium'
  | 'okx'
  | 'safepal'
  | 'unknown';

/**
 * Kaspa wallet connection state
 */
export interface KaspaWalletState {
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Connected wallet address (kaspa: format) */
  address: string | null;
  /** Wallet provider name */
  provider: KaspaWalletProvider | null;
  /** Error message if connection failed */
  error: string | null;
  /** Optional SIWK authentication result */
  siwkAuth?: import('./auth').SIWKAuthResult;
}

/**
 * Kaspa wallet provider information
 */
export interface KaspaWalletProviderInfo {
  /** Provider identifier */
  id: KaspaWalletProvider;
  /** Display name */
  name: string;
  /** Provider icon URL or path */
  icon?: string;
  /** Whether this provider is installed/detected */
  isInstalled: boolean;
  /** Installation/download URL */
  downloadUrl?: string;
  /** Documentation URL */
  documentationUrl?: string;
}

/**
 * Kaspa wallet provider interface
 * Expected interface that wallets inject into window
 */
export interface KaspaWalletProviderInterface {
  /** Check if wallet is connected */
  isConnected(): boolean;
  /** Get current address */
  getAddress(): Promise<string | null>;
  /** Request connection */
  requestConnection(): Promise<string>;
  /** Disconnect wallet */
  disconnect(): Promise<void>;
  /** Sign a message */
  signMessage(message: string): Promise<string>;
  /** Send a transaction */
  sendTransaction(transaction: any): Promise<string>;
  /** Toccata covenant tx (optional, wallet-provided). */
  sendCovenantTransaction?(request: CovenantTxRequest): Promise<CovenantTxResult>;
  /** Report tx v1 / covenant support (optional). */
  getCovenantCapabilities?(): Promise<CovenantCapabilities>;
  /** Listen for account changes */
  on(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
  /** Remove event listener */
  removeListener(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
}

/**
 * Extended Window interface with Kaspa wallet providers
 */
export interface WindowWithKaspa extends Window {
  kasware?: KaspaWalletProviderInterface;
  /** Kastle injects `window.kastle` (API differs; we adapt in `wallet.ts`). */
  kastle?: any;
  kaspium?: KaspaWalletProviderInterface;
  okx?: {
    kaspa?: KaspaWalletProviderInterface;
  };
  safepal?: {
    kaspa?: KaspaWalletProviderInterface;
  };
}

/**
 * Kaspa address utilities
 */
export interface KaspaAddress {
  /** Full address with kaspa: prefix */
  full: string;
  /** Address without prefix */
  short: string;
  /** Display format (truncated) */
  display: string;
}

import type {
  CovenantCapabilities as ProgrammabilityCovenantCapabilities,
  CovenantTxRequest as ProgrammabilityCovenantTxRequest,
  CovenantTxResult as ProgrammabilityCovenantTxResult,
} from '@/lib/programmability/types';

export type CovenantTxRequest = ProgrammabilityCovenantTxRequest;
export type CovenantTxResult = ProgrammabilityCovenantTxResult;
export type CovenantCapabilities = ProgrammabilityCovenantCapabilities;

/**
 * Kaspa transaction request
 */
export interface KaspaTransactionRequest {
  /** Recipient address */
  to: string;
  /** Amount in sompi (smallest unit), as decimal string */
  amount: string;
  /** Optional fee */
  fee?: string;
  /** Optional plain-text note / memo (wallet-dependent) */
  note?: string;
  /** Optional hex payload for wallets that support it (e.g. KasWare metadata binding) */
  payload?: string;
}

/**
 * Kaspa transaction response
 */
export interface KaspaTransactionResponse {
  /** Transaction hash */
  txHash: string;
  /** Transaction status */
  status: 'pending' | 'confirmed' | 'failed';
  /** Error message if failed */
  error?: string;
}

