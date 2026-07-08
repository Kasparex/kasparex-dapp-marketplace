/**
 * Genesis Dapp Type Definitions
 */

export interface GenesisMessage {
  id: number;
  /** Plain text excerpt for search and previews. */
  message: string;
  contentHtml: string;
  author: string;
  timestamp: number;
  payloadBytes: number;
  chunkCount: number;
  feeKas: number;
  /** Simulated or on-chain reference (covenant-ready). */
  txRef?: string;
}

export interface GenesisDappState {
  messageCount: number;
  maxMessageLength: number;
}

export interface LeaveMessageParams {
  contentHtml: string;
  author: string;
  feeKas: number;
  payloadBytes: number;
  chunkCount: number;
}

export interface GenesisDappConfig {
  dAppId: number;
  contractAddress: string;
  maxMessageLength: number;
}
