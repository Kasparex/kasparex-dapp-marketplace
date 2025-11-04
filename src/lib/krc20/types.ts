/**
 * KRC-20 Token Type Definitions
 * 
 * Types for KRC-20 tokens on Kaspa Layer 1 network
 */

/**
 * KRC-20 Token Metadata
 */
export interface KRC20Token {
  /** Token ticker symbol (e.g., "KREX") */
  symbol: string;
  /** Token full name */
  name: string;
  /** Token contract address (Kaspa address format) */
  address: string;
  /** Number of decimals for token display */
  decimals: number;
  /** Total supply of the token */
  totalSupply?: string;
  /** Maximum supply of the token */
  maxSupply?: string;
  /** Minting limit per transaction */
  limit?: string;
  /** Amount minted so far */
  minted?: string;
  /** Number of token holders */
  holders?: number;
  /** Number of transactions */
  transactionCount?: number;
  /** Token logo URL or path */
  logo?: string;
  /** Token description */
  description?: string;
  /** Token website URL */
  website?: string;
  /** Social media links */
  socialLinks?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  /** Token creation date/timestamp */
  createdAt?: string;
  /** Token last update timestamp */
  updatedAt?: string;
  /** Token creator address */
  creator?: string;
  /** Market data (if available) */
  marketData?: {
    price?: number;
    marketCap?: number;
    volume24h?: number;
    holders?: number;
  };
}

/**
 * KRC-20 Token Balance
 */
export interface KRC20Balance {
  /** Token symbol */
  symbol: string;
  /** Token address */
  tokenAddress: string;
  /** Balance amount (as string to handle large numbers) */
  balance: string;
  /** Formatted balance for display */
  formattedBalance: string;
  /** Number of decimals */
  decimals: number;
  /** Token metadata */
  token?: KRC20Token;
}

/**
 * KRC-20 Token Transaction
 */
export interface KRC20Transaction {
  /** Transaction hash */
  txHash: string;
  /** From address */
  from: string;
  /** To address */
  to: string;
  /** Token symbol */
  symbol: string;
  /** Token address */
  tokenAddress: string;
  /** Amount transferred */
  amount: string;
  /** Transaction timestamp */
  timestamp: number;
  /** Block height */
  blockHeight?: number;
}

/**
 * KRC-20 Token List Response (from API)
 */
export interface KRC20TokenListResponse {
  tokens: KRC20Token[];
  total?: number;
  page?: number;
  pageSize?: number;
}

/**
 * KRC-20 Token Balance Response (from API)
 */
export interface KRC20BalanceResponse {
  address: string;
  balances: KRC20Balance[];
  totalTokens?: number;
}

/**
 * KRC-20 API Error Response
 */
export interface KRC20APIError {
  error: string;
  message?: string;
  code?: number;
}

/**
 * Token metadata from kas.fyi indexer
 */
export interface KasFyiTokenData {
  ticker: string;
  name: string;
  address: string;
  decimals: number;
  totalSupply?: string;
  logo?: string;
  description?: string;
  website?: string;
  social?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  createdAt?: string;
  creator?: string;
}

/**
 * Token metadata from kaspa.com/tokens marketplace
 */
export interface KaspaTokensMarketplaceData {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  totalSupply?: string;
  logo?: string;
  description?: string;
  website?: string;
  social?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  marketData?: {
    price?: number;
    marketCap?: number;
    volume24h?: number;
    holders?: number;
  };
}

