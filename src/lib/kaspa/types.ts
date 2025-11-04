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

/**
 * Kaspa transaction request
 */
export interface KaspaTransactionRequest {
  /** Recipient address */
  to: string;
  /** Amount in KAS (or smallest unit) */
  amount: string;
  /** Optional fee */
  fee?: string;
  /** Optional note/memo */
  note?: string;
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

/**
 * Kaspa Network Types
 * Types for Kaspa network information and blockchain data
 */

/**
 * Kaspa Block
 */
export interface KaspaBlock {
  /** Block hash */
  hash: string;
  /** Block height */
  height?: number;
  /** Blue score */
  blueScore?: number;
  /** DAA score */
  daaScore?: number;
  /** Parent block hashes */
  parents?: string[];
  /** Block timestamp */
  timestamp?: number;
  /** Transaction count */
  transactionCount?: number;
  /** Block size in bytes */
  size?: number;
}

/**
 * Kaspa Network Information
 */
export interface KaspaNetworkInfo {
  /** Network name */
  networkName?: string;
  /** Current block height */
  blockHeight?: number;
  /** Current blue score */
  blueScore?: number;
  /** Current DAA score */
  daaScore?: number;
  /** Network hashrate */
  hashrate?: number;
  /** Network difficulty */
  difficulty?: number;
  /** Circulating supply */
  supply?: number;
  /** Max supply */
  maxSupply?: number;
  /** Active node count */
  nodeCount?: number;
  /** Average block time in seconds */
  averageBlockTime?: number;
  /** Transactions per second */
  tps?: number;
  /** Total transactions */
  totalTransactions?: number;
}

/**
 * Kaspa Network Stats
 */
export interface KaspaNetworkStats {
  /** Network information */
  networkInfo: KaspaNetworkInfo;
  /** Latest blocks */
  latestBlocks?: KaspaBlock[];
  /** Network health status */
  health?: 'healthy' | 'degraded' | 'down';
  /** Last updated timestamp */
  lastUpdated?: number;
}

/**
 * BlockDAG Node for visualization
 */
export interface BlockDAGNode {
  /** Block hash */
  hash: string;
  /** Block height */
  height?: number;
  /** Blue score */
  blueScore?: number;
  /** DAA score */
  daaScore?: number;
  /** X position for visualization */
  x?: number;
  /** Y position for visualization */
  y?: number;
  /** Parent block hashes */
  parents?: string[];
  /** Children block hashes */
  children?: string[];
  /** Block timestamp */
  timestamp?: number;
}

